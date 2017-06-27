<?php require_once('lib/Db.class.php'); ?>

<?php
//session management
$session = session_id();
if(!$session){
	session_start();
	$session = session_id();	
}

//prepare
$db = new Db();
$input = file_get_contents('php://input');
$input = json_decode($input,true);

$method = $_SERVER['REQUEST_METHOD'];
$user="<db_userid>"; //defaulted to generic user with limited rights
$pass="<db_pass>"; //defaulted to generic user with limited rights

$id = 0;
$timestamp = $_GET["since"];
$entity = $_GET["entity"];
$changeIndicator = "U";
$changeRecord="{}";

//authentication and session management
if ( isset($_SERVER['PHP_AUTH_USER'] ) ){
	if($_SERVER['PHP_AUTH_USER'] != "" ){
		$_SESSION["USER"] = $_SERVER['PHP_AUTH_USER'] ;
		$_SESSION["PASS"] = $_SERVER['PHP_AUTH_PW'] ;		
	}
}

//username?
if(isset($_SESSION["USER"]) ){
	$user = $_SESSION["USER"];
}

//password?
if(isset($_SESSION["PASS"]) ){
	$pass = $_SESSION["PASS"];
}

// create SQL based on HTTP method
switch ($method) { //CR based database with NoSQL
	case 'GET':
		if(isset( $input["since"] ) ) 		$timestamp 			= $input["timestamp"];
		if(isset( $input["entity"] ) ) 		$entity 			= $input["entity"];

		if(isset( $_GET["count"] ) ){
			echo $db->getChangesCount($entity, $timestamp, $user, $pass);
		}else if(isset( $_GET["logon"] ) && isset( $_SESSION["USER"] ) && isset( $_SESSION["PASS"] ) ){
			echo $db->getChangesCount($entity, $timestamp, $_SESSION["USER"], $_SESSION["PASS"]);
		}else{
			echo  $db->getEntitySince($entity, $timestamp, $user, $pass ) ; //pretty simple, just load everything. filter on frontend						
		}
		
		break;
		
	case 'POST':
		if(isset( $input["id"] ) ) 				$id 				= $input["id"];
		if(isset( $input["entity"] ) ) 			$entity 			= $input["entity"];
		if(isset( $input["changeIndicator"] ) ) $changeIndicator 	= $input["changeIndicator"];
		if(isset( $input["changeRecord"] ) ) 	$changeRecord		= $input["changeRecord"];

		if(isset( $_SESSION["USER"] ) && isset( $_SESSION["PASS"] ) ){
			echo $db->addEntity( $id, $entity, $changeIndicator, $changeRecord, $_SESSION["USER"], $_SESSION["PASS"] ); 
		}else{
			die("not authorized");
		}
		break;
}
?>
