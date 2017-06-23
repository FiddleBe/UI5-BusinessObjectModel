<?php
class Db {
	public function __construct( ){			
	}

	public function addEntity( $id, $entity, $changeIndicator, $changeRecord, $user, $pass ){
		$json="{nok}";
		$mysql = $this->getDBmysql($user, $pass);
		
		$date = new DateTime();
		$timestamp = $date->getTimestamp();
		
		$timestamp = date('Y-m-d H:i:s', $timestamp);
		
		if(!$id || !$changeRecord || !$changeIndicator ){
			header('HTTP/1.1 500 Internal Server Error');
			exit;
		}
		
		$dbId 				= base64_encode( $id );
		$dbEntity			= base64_encode( $entity );
		$dbChangeIndicator 	= base64_encode( $changeIndicator );
		$dbChangeRecord 	= base64_encode( json_encode($changeRecord) );

		$sql = 	"insert into `Monsters`.`entity` (id, entity, timestamp, changeIndicator, changeRecord) " .
				"VALUES ( '$dbId', '$dbEntity', '$timestamp', '$dbChangeIndicator', '$dbChangeRecord')";
				
		if( $mysql->query($sql) === true ){
			$json='{ "id":"'.$id.'",'. 
					'"entity":"'.$entity.'",'.
					'"changeIndicator":"'.$changeIndicator.'",' .
					'"changeRecords":'.json_encode($changeRecord).
					'}';
		}else{
			die("error: \n" . $mysql->error . ",\n SQL: \n" . $sql);
		}
		$this->closeDBmysql($mysql);
		
		return $json;
	}
	
	public function getEntitySince($entity, $timestamp , $user, $pass){
		if($timestamp){
			$timestamp =  substr("$timestamp", 0, 10) ; //apparently w3C timestamp is not recognized by mysql...
		}
		if(!$timestamp){
			$date = new DateTime("1970-01-01");
			$timestamp = $date->getTimestamp();
		}
		$timestamp = date('Y-m-d H:i:s', $timestamp);
		$entity	   = base64_encode( $entity );

		$monsters = $this->getFromDatabaseAsJSON( "select * from `Monsters`.`entity` where entity = '$entity' and timestamp > '$timestamp' order by timestamp limit 10;", $user, $pass );
		return $monsters;
	}

	public function getChangesCount($entity, $timestamp , $user, $pass){
		if($timestamp){
			$timestamp =  substr("$timestamp", 0, 10) ; //apparently w3C timestamp is not recognized by mysql...
		}
		if(!$timestamp){
			$date = new DateTime("1970-01-01");
			$timestamp = $date->getTimestamp();
		}
		$timestamp = date('Y-m-d H:i:s', $timestamp);
		$entity	   = base64_encode( $entity );

		$mysql = $this->getDBmysql($user, $pass);
		// excecute SQL statement
		if($mysql){
			$sql = "select count( id ) from `Monsters`.`entity` where entity = '$entity' and timestamp > '$timestamp';";
			$result = $mysql->query($sql);			
		}

		$json = "";
		do{						
			$row  = $result->fetch_row();
			if(!$row){
				break;
			}

			$json = '{"count":"'. $row[0] . '"}';
		} while($row);
		
		$result->close();		
		$this->closeDBmysql($mysql);
		
		return $json;
	}

	private function getFromDatabaseAsJSON( $sql, $user, $pass ){
		$json = '';
		
		$mysql = $this->getDBmysql($user, $pass);
		
		// excecute SQL statement
		if($mysql){
			$result = $mysql->query($sql);			
		}
		
		if(!$result){
			die( $sql );
		}
		
		do{						
			$row  = $result->fetch_row();
			if(!$row){
				break;
			}

			if($json != ""){
				$json = $json . ','; 
			}
			$date = strtotime( $row[2] );
			$timestamp = date(DATE_W3C, $date );

			$json = $json .
					'{"id":"'. base64_decode( $row[0]) . 
					'","entity":"'.base64_decode( $row[1]).
					'","timestamp":"' . $timestamp . //this is btw the server timestamp
					'","changeIndicator":"' . base64_decode( $row[3]).
					'","changeRecords":['. base64_decode(  $row[4]).
					']}';
		} while($row);
		
		$result->close();		
		$this->closeDBmysql($mysql);

		return  '[' . $json . ']';	
	}
	
	private function getDBmysql($user, $pass){
		// connect to the mysql database
		$mysqli = new mysqli('localhost', $user, $pass, 'Monsters');
		$mysqli->set_charset('utf8');	

		// die if no connection
		if ($mysqli->connect_error) {
			die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
		}
		
		return $mysqli;
	}
	
	private function closeDBmysql($mysqli){
		// close mysql connection
		if($mysqli){
			$mysqli->close();						
		}
	}
}
?>