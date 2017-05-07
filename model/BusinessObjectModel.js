/**
 * @Author Tom Van Doorslaer
 * base class for an object model
 * an objectmodel is actually based on a JSONModel (or a DBModel)
 * but where a normal model entity only contains the data as properties, the object model can also contain methods on it's instance
 * Every record in the model is represented by an object, on which you can call methods
 * like: oUIElement.getBindingContext().getObject().<someMethod>
**/
sap.ui.define([
        "sap/ui/model/json/JSONModel",
		"be/fiddle/BusinessObjectModel/model/BusinessObject"
],
    function (Model, BusinessObject) {
        "use strict";

/**
 * TODO: The JSON model has an URL, which we use for initial reading, posting and synchronization
 * how do I match this with the DBModel
 * Should we automatically read when we create the model?
 * or should we read from the DB (if info provided in settings), move the result as an object to the model
 * store the url somewhere, and only post and read on model.sync operations?
 **/
        /*---------------------------------------instance ------------------------------------------------------*/
        var ObjectModel = Model.extend("be.fiddle.BusinessObjectModel.model.BusinessObjectModel", {
        	/*
        	oSettings:{
        		ObjectClass:"path.to.businessobject.class"
        		db:"databasename"
        		store:"tablename. typically your entity name"
        	}
        	*/
            constructor: function (sUrl, oSettings) {
                //instance constructor
                this.sUrl = sUrl || (oSettings && oSettings.url );	//remember this for sync operations
                this.sTestData = oSettings && oSettings.testData;
                this.oSettings = oSettings; //keep the settings, since you'll need them for synchronization afterwards

                //by default, use the standard JSON model if there is no db defined, it's an online only model
                if(oSettings && oSettings.db){
	                //if there is DB information in your settings object, make sure you bind this model to that DB
                	Model.prototype.constructor.apply(this, {} ); //pass an empty object to the jsonmodel, since the data will come from the DB
	                this.getDataFromDb(oSettings)		//get data from db
	                .then( this.setData.bind(this) );	//and move it into the object model
                }else{
                	Model.prototype.constructor.apply(this, arguments ); //there is no DB: online only: get data from service url
                }
 
                this.oData = {entries:[]};

                //here we create a reference to the object-instance-template
                this.objectClassName = oSettings.ObjectClass;
                if(this.objectClassName){
					//load the class definition
					jQuery.sap.require(this.objectClassName);
					
					//load the class references
					var aParts = this.objectClassName.split(".");
					this.objectClass = window;
					
					//attempt to cycle through the object tree to get the template class into a reference
					for(var i = 0; i< aParts.length; i++){
						if(this.objectClass){
							this.objectClass = this.objectClass[aParts[i] ];
						}else{
							this.objectClass = null;
							break;
						}
					}
                }
            } 
        });

        ObjectModel.prototype.getObject = function ( sPath, oCtx, oParams) { 
            var oData = Model.prototype.getObject.apply(this, arguments);
			
			if( oData instanceof BusinessObject ){ //if the object retrieved from the model is already an instance
            	oData.attachPropertyUpdated(null, this.onPropertyUpdated, this);
				return oData;
			}
            else if( sPath.startsWith("/entries") && window[this.objectClass] instanceof BusinessObject) {
                //by doing this, we create a new instance of the template class and pass the reference of our model-data
                //in theory, if you update th contents of the data-object, they will also update in the model and trigger changes
                //that's because the oData variable is a pointer to the model data entry.
                //but that's the theory. I wonder how it will work in practice
                var oObject = this.objectClass.getObject(oData);
	            oObject.attachPropertyUpdated(null, this.onPropertyUpdated, this);
                return oObject;
            }
            else {
                //if the template class is unknow, just return the classical data object
                return oData;
            }
        };//The context.getObject returns an instance of the template class, with the data loaded
        
        ObjectModel.prototype.setObject = function( sPath, oObject ){
        	if(sPath){
        		this.setProperty(sPath, oObject);
        		return true;
        	}
        	else{
        		var i = this.entries.length;
        		while(i--){
        			oTemp = this.entries[i];
        			if(oTemp instanceof BusinessObject && oTemp.isThisYou(oObject) ){
        				this.entries[i] = oObject;
        				return true;
        			}
        		}
        	}
      		return false;
        };
        
        ObjectModel.prototype.create = function( sPath ){
        	var oObject = new this.objectClass({id:jQuery.sap.uid()});
        	
        	if(!sPath){
        		sPath = "/entries";
        	}

			if(sPath === "/entries" ){
	            oObject = this.addObject(sPath, oObject);
	            oObject.attachPropertyUpdated(null, this.onPropertyUpdated, this);
	            return oObject;
			}
			
			throw "can only perform create on path /entries";
        };

        ObjectModel.prototype.addObject = function (sPath, oObject) {
            var aObjects = this.getProperty(sPath);

        	if(!sPath){
        		sPath = "/entries";
        	}

        	if(sPath !== "/entries"){
				throw "can only add objects on path /entries";
        	}
            
            //if it's not an array yet..make it one
            if(!aObjects || !aObjects.length || Object.keys(aObjects).length === 0 ){
            	aObjects = [];
            }
            
            aObjects.push(oObject);
            this.setProperty(sPath, aObjects);
            oObject.attachPropertyUpdated(null, this.onPropertyUpdated, this);
            
            return oObject;
        };//add a new object to the collection

        ObjectModel.prototype.removeObject = function (sPath, oObject) {
            var aObjects = this.getProperty(sPath);

        	if(!sPath){
        		sPath = "/entries";
        	}

        	if(sPath !== "/entries"){
				throw "can only remove objects from path /entries";
        	}

            if(!aObjects){
            	aObjects = [];
            }

            for (var i = 0; i < aObjects.lenght; i++) {
                if(aObjects[i] === oObject){
                    aObjects.splice(i, 1);
                }
            }

            this.setProperty(sPath, aObjects);
            return this; //chaining
        };//remove an object from the collection. Object is not destroyed!

        ObjectModel.prototype.loadData = function (sURL, oParameters, bAsync, sType, bMerge, bCache, mHeaders) {
			if(!sURL ){
				sURL = this.sUrl;
			}
			
			//fallback to test data
            if(this.sTestData && sURL !== this.sTestData){
            	this.attachRequestFailed( {oParameters:oParameters, bAsync:bAsync, sType:sType, bMerge:bMerge, bCache:bCache, mHeaders:mHeaders}, 
            							this.loadTestData, 
            							this );
				this.attachParseError(  {oParameters:oParameters, bAsync:bAsync, sType:sType, bMerge:bMerge, bCache:bCache, mHeaders:mHeaders}, 
            							this.loadTestData, 
            							this );
            }

            Model.prototype.loadData.call(this,sURL, oParameters, bAsync, sType, bMerge, bCache, mHeaders); //trigger the superior model implementation
        };//redefine setData, make it so that it convers every entry into an object before adding into the collection
        
        ObjectModel.prototype.loadTestData = function(oData){
			this.detachRequestFailed(this.loadTestData, this);
			this.detachParseError(this.loadTestData, this);
			this.loadData(this.sTestData, oData.oParameters, oData.bAsync, oData.sType, oData.bMerge, oData.bCache, oData.mHeaders);
        };//backup for test data
        
        ObjectModel.prototype.setData = function (oData, bMerge) {
            var aData = [];
            
            if (oData instanceof Array) {
                aData = oData;
            }else {
                aData.push(oData);
            }

            for (var i = 0; i < aData.length; i++) {
            	var bMerged = false;
            	
            	//first, we should look if this object already exists in our collection
            	for(var j = 0 ; j < this.oData.entries.length; j++){
            		var oEntry = this.oData.entries[j];
            		
            		if(oEntry instanceof BusinessObject && oEntry.isThisYou( aData[i] ) ){
            			//we have a match: add the change documents to the change document collection
            			oEntry.addChangeRecords(aData[i].changeRecords);
            			bMerged = true;
            			break;
            		}
            	}
            	if(!bMerged && this.objectClass && ! (aData[i] instanceof this.objectClass) ){
	                var oObject = this.objectClass.getObject(aData[i]);
	                this.oData.entries.push(oObject);
	                bMerged = true;
            	}else if(!bMerged ){
            		this.oData.entries = this.oData.entries.concat(aData[i]);
	                bMerged = true;
            	}
            }

            arguments[0] = this.oData; //fool javascript into using the prepared array.
            Model.prototype.setData.apply(this,arguments); //trigger the superior model implementation
        };//redefine setData, make it so that it convers every entry into an object before adding into the collection
        
        ObjectModel.prototype.getDataFromDb = function(oSettings){ 
        	var oProm = new Promise(function(resolve, reject){
				var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;// || window.shimIndexedDB;
				if(!indexedDB){ throw new Error("No indexed DB support");}
				
				// Open (or create) the database
				var oRequest = indexedDB.open(this.oSettings.db, 1);

				// Create the schema
				oRequest.onupgradeneeded = this.createDbTable.bind(this);

				oRequest.onsuccess = function(oEvent) {
					var db = oEvent.target.result;					
					var tx = db.transaction(this.oSettings.store, "readwrite");
					var store = tx.objectStore(this.oSettings.store);
					var oGetStore = store.getAll();
					
					oGetStore.onsuccess = function(oEvent){
				    	resolve(oEvent.target.result);
					}.bind(this)
					
					oGetStore.onerror = function(oEvent){
						reject( new Error("IndexedDb not accessible") );
					}.bind(this)
				
				}.bind(this);	
				
				oRequest.onError = function(oEvent){
					reject( new Error("IndexedDb not accessible") );
				}.bind(this)
			}.bind(this) );
			
			return oProm;
        };//load the data from the database using the info in the settings object (manifest) (promise)

        ObjectModel.prototype.saveDataToDb = function(aData){ 
        	//assumption: the data records coming in via the aData array, are already processed into business objects
        	//
        	var oProm = new Promise(function(resolve, reject){
        		if(! (aData instanceof Array) ){
        			reject( new Error("saveToDb only accepts an array of serializable business objects"));
        			return;
        		}
        		
				var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;// || window.shimIndexedDB;
				if(!indexedDB){ throw new Error("No indexed DB support");}
				
				// Open (or create) the database
				var oRequest = indexedDB.open(this.oSettings.db, 1);

				// Create the schema (if necessary)
				oRequest.onupgradeneeded = this.createDbTable.bind(this);

				oRequest.onsuccess = function(oEvent) {
					var db = oEvent.target.result;					
					var tx = db.transaction(this.oSettings.store, "readwrite");
					var store = tx.objectStore(this.oSettings.store);
					
					//can't I simply put all records at once?
					var aProm = [];
					for(var i = 0; i < aData.length; i++){
						var oData = aData[i];
						var oProm = new Promise(function(putResolve, putReject){
							var oPutStore = store.put(oData.getJSON() , oData.id); //or do I need to call, getJSON?
							
							oPutStore.onsuccess = function(oEvent){
						    	putResolve(oEvent.target.result);
							}.bind(this)
							
							oPutStore.onerror = function(oEvent){
								reject( new Error("IndexedDb not accessible") );
							}.bind(this)
						});
						aProm.push(oProm);
					}

					Promise.all(aProm)
					.then(function(aResults){
						resolve(aResults); 
					}.bind(this))
					.catch(function(reason){ //what if something failed?
					  jQuery.sap.log.error(reason);
					  reject(reason);
					}.bind(this));
				
				}.bind(this);	
				
				oRequest.onError = function(oEvent){
					reject( new Error("IndexedDb not accessible") );
				}.bind(this)
			}.bind(this) );
			
			return oProm;
        };//load the data from the database using the info in the settings object (manifest) (promise)
        
        ObjectModel.prototype.createDbTable = function(oEvent){ 
		    var db = oEvent.target.result;
		    var store = db.createObjectStore(this.oSettings.store , {keyPath: "id"});
        };//Create your DB-table from the received data (promise)

        ObjectModel.prototype.sync = function( oLastSyncDate, sModelName ){ 
        	var sName = sModelName || "Unnamed";
        	jQuery.sap.log.info("starting sync process for model: " + this.sName );
        	
        	var oPromise = new Promise(function(resolve, reject) {
				//use the settings stored previously
				var sUrl = this.sUrl;
				var sSince = (oLastSyncDate && ("" + oLastSyncDate)) || "0";
				
				//prepare the url to receive parameters
				if(sUrl.includes("?") ){
					sUrl = "" + sUrl + "&";
				}else{
					sUrl = "" + sUrl + "?";
				}

				/*
				//prepare a newDataDownloaded function
				var fnNewDataDownloaded = function(oData){
					this.setData(oData, true);
					resolve({"success":true, "data":oData, "message": "" + oData.length + " new objects have been downloaded for model " + sName });
				}.bind(this) ;

				//prepare a downloadFailed function
				var fnDownloadFailed = function(oErr){
					reject({"success":false, "data":oErr, "message":"Download new data failed for: " + sUrl });
				}.bind(this) ;
	        	
				//first: get everything arrived on the server since last syncdate in a delta-array
				jQuery.ajax({
				    type : "GET",
				    contentType : "application/json",
				    url : sUrl + "since=" + sSince,
				    dataType : "json",
				    async: true, 
				    success : fnNewDataDownloaded,
				    error : fnDownloadFailed
				});
				*/
				
				this.loadData(sUrl + "since=" + sSince, 
					{
						dataType : "json",
	    				async: true
					},
					true,
					"json",
	    			true
	    		);
	    			
		        //check if your local db exists: if not, create it based on what you just retrieved ({id:xx, {jsonobject} })/or {id, timestamp, otherfields...}
		        //send everything changed in this model since the lastSyncDate to the service url (post)
		        //add your delta-array to the DB
		        
		        //preferably, do all this in a worker or a promise
			}.bind(this) );
			
			return oPromise;
        };//sync your DB content with the server content //#TODO

        ObjectModel.prototype.storeSyncProperties = function(){
        };//#TODO

        ObjectModel.prototype.loadSyncProperties = function(){
        };//#TODO
        
        ObjectModel.prototype.onPropertyUpdated = function(sPath, oValue){
        	//debugger;
        	//this.firePropertyChange({Reason:sap.ui.model.ChangeReason.Change, path:sPath, value:oValue});
			this.refresh(); //refresh bindings (refine upto path?)
        };
        
        ObjectModel.ClassConstructor = function () {

        }; //static constructor

        setTimeout(ObjectModel.ClassConstructor.bind(this),1); //statically call the class constructor (after completionof definition)

        return ObjectModel;
    }
);