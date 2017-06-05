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
ini_set("allow_url_fopen", true);
$input = file_get_contents('php://input');
echo $input;
$input = json_decode($input,true);

$method = $_SERVER['REQUEST_METHOD'];
$user="monster_doctor"; //defaulted to generic user with limited rights
$pass="bE}3s2TNVsA;"; //defaulted to generic user with limited rights

$id = 0;
$timestamp = $_GET['since'];
$entity = $_GET['entity'];
$changeIndicator = "U";
$changeRecord="{}";

//authentication and session management
if ( isset($_SERVER['PHP_AUTH_USER'] ) ){
	$_SESSION["USER"] = $_SERVER['PHP_AUTH_USER'] ;
	$_SESSION["PASS"] = $_SERVER['PHP_AUTH_PW'] ;
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
		if(isset( $input["entity"] ) ) 			$entity 			= $input["entity"];

		if(isset( $input["count"] ) ){
			echo $db->getChangesCount($entity, $timestamp, $user, $pass);
		}else{
			echo  $db->getEntitySince($entity, $timestamp, $user, $pass ) ; //pretty simple, just load everything. filter on frontend						
		}
		
		break;
		
	case 'POST':
		if(isset( $input["id"] ) ) 				$id 				= $input["id"];
		if(isset( $input["entity"] ) ) 			$entity 			= $input["entity"];
		if(isset( $input["changeIndicator"] ) ) $changeIndicator 	= $input["changeIndicator"];
		if(isset( $input["changeRecord"] ) ) 	$changeRecord		= $input["changeRecord"];

		echo $db->addEntity( $id, $entity, $changeIndicator, $changeRecord, $user, $pass ); 
		break;
}
?>