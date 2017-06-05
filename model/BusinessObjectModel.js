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
	                
	                this.loadSyncProperties(); //load, or initialize the sync properties
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
				var oObject = oData; //I should use "let", but webide doesn't support
				
				//make sure you remove the old handlers
            	oObject.detachPropertyUpdated(null, this.onPropertyUpdated, this);
	            oObject.detachSaveRequested(null, this.onSaveDateToDb, this);
	            
	            //and attach new ones
            	oObject.attachPropertyUpdated(null, this.onPropertyUpdated, this);
	            oObject.attachSaveRequested(null, this.onSaveDateToDb, this);
	            
				return oObject;
			}
            else if( sPath.startsWith("/entries") && window[this.objectClass] instanceof BusinessObject) {
                //by doing this, we create a new instance of the template class and pass the reference of our model-data
                //in theory, if you update th contents of the data-object, they will also update in the model and trigger changes
                //that's because the oData variable is a pointer to the model data entry.
                //but that's the theory. I wonder how it will work in practice
                var oObject = this.objectClass.getObject(oData); //I should use "let", but webide doesn't support

				//make sure you remove the old handlers
            	oObject.detachPropertyUpdated(null, this.onPropertyUpdated, this);
	            oObject.detachSaveRequested(null, this.onSaveDateToDb, this);
	            
	            //and attach new ones
            	oObject.attachPropertyUpdated(null, this.onPropertyUpdated, this);
	            oObject.attachSaveRequested(null, this.onSaveDateToDb, this);
	            
                return oObject;
            }
            else {
                //if the template class is unknow, just return the classical data object
                return oData;
            }
        };//The context.getObject returns an instance of the template class, with the data loaded
        
        ObjectModel.prototype.getChangesSince = function(dLastSync){
    		var i = (this.oData.entries && this.oData.entries.length ) || 0;
    		var aChanges = [];
    		
    		if(!dLastSync){
    			dLastSync = this._dLastUpload;
    		}
    		
    		while(i--){
    			var oBusobj = this.oData.entries[i];
    			if(oBusobj instanceof BusinessObject ){
    				aChanges = aChanges.concat(oBusobj.getChangesSince(dLastSync) );
    			}
    		}
    		
    		//make sure the changes are sorted by timestamp globally
    		aChanges.sort(function(a,b){ 
				if(a.timestamp < b.timestamp){
					return -1;
				}
				if(a.timestamp > b.timestamp){
					return 1;
				}
				
				return 0;
			});
    		
    		return aChanges;
        };
        
        ObjectModel.prototype.getLastDownload = function(){
        	return this._dLastDownload || new Date(0);
        };
        
        ObjectModel.prototype.getLastUpload = function(){
        	return this._dLastUpload || new Date(0);
        };
        
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
        	var oObject = new this.objectClass({id:jQuery.sap.uid(), changeRecords:[] });
        	oObject.generateChangeRecord("I");
        	
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

        ObjectModel.prototype.removeObject = function (sPath /*optional*/, oObject) {
        	if(!(typeof sPath === "string") || sPath instanceof BusinessObject) {
        		oObject = sPath;
        		sPath = "/entries";
        	}
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
                if(aObjects[i].isThisYou(oObject) ){
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
			
			var oPromise = new Promise(function(resolve, reject){
				//fallback to test data
	            if(this.sTestData && sURL !== this.sTestData){
	            	this.attachRequestFailed( {oParameters:oParameters, bAsync:bAsync, sType:sType, bMerge:bMerge, bCache:bCache, mHeaders:mHeaders}, 
	            							this.loadTestData, 
	            							this );
					this.attachParseError(  {oParameters:oParameters, bAsync:bAsync, sType:sType, bMerge:bMerge, bCache:bCache, mHeaders:mHeaders}, 
	            							this.loadTestData, 
	            							this );
	            }
				this.attachRequestCompleted(function(oEvent){ resolve(oEvent.data) });
				
	            Model.prototype.loadData.call(this,sURL, oParameters, bAsync, sType, bMerge, bCache, mHeaders); //trigger the superior model implementation
			});
			
			return oPromise;
        };//redefine setData, make it so that it convers every entry into an object before adding into the collection
        
        ObjectModel.prototype.loadTestData = function(oData){
			this.detachRequestFailed(this.loadTestData, this);
			this.detachParseError(this.loadTestData, this);
			return this.loadData(this.sTestData, oData.oParameters, oData.bAsync, oData.sType, oData.bMerge, oData.bCache, oData.mHeaders);
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
				oRequest.onupgradeneeded = this._createDbTable.bind(this);

				oRequest.onsuccess = function(oEvent) {
					var oDb = oEvent.target.result;					
					var oTx = oDb.transaction(this.oSettings.store, "readwrite");
					var store = oTx.objectStore(this.oSettings.store);
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

        ObjectModel.prototype.saveDataToDb = function(aObjects){ 
        	//assumption: the data records coming in via the aData array, are already processed into business objects
        	//
        	var oProm = new Promise(function(resolve, reject){
        		if(! (aObjects instanceof Array) ){
        			reject( new Error("saveToDb only accepts an array of serializable business objects"));
        			return;
        		}
        		
				var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;// || window.shimIndexedDB;
				if(!indexedDB){ throw new Error("No indexed DB support");}
				
				// Open (or create) the database
				var oRequest = indexedDB.open(this.oSettings.db, 1);

				// Create the schema (if necessary)
				oRequest.onupgradeneeded = this._createDbTable.bind(this);

				oRequest.onsuccess = function(oEvent) {
					var db = oEvent.target.result;					
					var tx = db.transaction(this.oSettings.store, "readwrite");
					var store = tx.objectStore(this.oSettings.store);
					
					//can't I simply put all records at once?
					var aProm = [];
					for(var i = 0; i < aObjects.length; i++){
						var oObject = aObjects[i];
						var oProm = new Promise(function(putResolve, putReject){
							var oData = oObject.getJSON();
							
							if(oObject.changeRecords && oObject.changeRecords.length > 0){
								var oLastChange = oObject.changeRecords[oObject.changeRecords.length - 1];
								oLastChange._stored = true;		////try to mark as stored
							}
							
							var oPutStore = store.put(oData );// , oObject.id); //put to db
							
							oPutStore.onsuccess = function(oEvent){
								oObject.onSaveComplete(oEvent);
						    	putResolve(oEvent.target.result);
							}.bind(this)
							
							oPutStore.onerror = function(oEvent){
								oObject.onSaveFailed(oEvent);
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
        
        ObjectModel.prototype._createDbTable = function(oEvent){ 
		    var db = oEvent.target.result;
		    var store = db.createObjectStore(this.oSettings.store , {keyPath: "id"});
        };//Create your DB-table from the received data (promise)

        ObjectModel.prototype.sync = function( sModelName ){ 
        	var sName = sModelName || "Unnamed";
        	jQuery.sap.log.info("starting sync process for model: " + this.sName );
        	
        	var aPromises = [];
        	aPromises.push(this.uploadchanges(this._dLastUpload, sModelName));
        	aPromises.push(this.downloadchanges(this._dLastdownload, sModelName));
			
			return oPromise;
        };//sync your DB content with the server content

        ObjectModel.prototype.getDownloadableChangesCount = function( dLastDownload, sModelName ){ 
			//use the settings stored previously
			var sUrl = this.sUrl;
			var dLastSync = dLastDownload  ||  this._dLastDownload ||  new Date(0)
			var sSince = "" + dLastSync;
			
			//prepare the url to receive parameters
			if(sUrl.includes("?") ){
				sUrl = "" + sUrl + "&";
			}else{
				sUrl = "" + sUrl + "?";
			}
				
        	var oProm = new Promise(function(resolve, reject){
				//prepare a newDataDownloaded function
				var fnNewDataDownloaded = function(oData){
			        resolve({"success":true, "data":oData.count, "message":"number of changes:"});
				}.bind(this) ;

				//prepare a downloadFailed function
				var fnDownloadFailed = function(oErr){
					reject({"success":false, "data":oErr, "message":"Download new data failed for: " + sUrl });
				}.bind(this) ;

				//first: get everything arrived on the server since last syncdate in a delta-array
				var oGetProm = jQuery.get({
				    contentType : "application/json",
				    url : sUrl + "since=" + sSince + "&count=true",
				    dataType : "json",
				    data:{since:sSince, count:true},
				    async: true
				});  
				oGetProm.done(fnNewDataDownloaded.bind(this) );
				oGetProm.fail(fnDownloadFailed.bind(this));
				
        	}.bind(this));

			return oProm;
        };
        
        ObjectModel.prototype.downloadChanges = function( dLastDownload, sModelName ){ 
			//use the settings stored previously
			var sUrl = this.sUrl;
			var dLastSync = dLastDownload  ||  this._dLastDownload ||  new Date(0)
			var sSince = "" + dLastSync;
			
			//prepare the url to receive parameters
			if(sUrl.includes("?") ){
				sUrl = "" + sUrl + "&";
			}else{
				sUrl = "" + sUrl + "?";
			}
				
        	var oProm = new Promise(function(resolve, reject){
				//prepare a newDataDownloaded function
				var fnNewDataDownloaded = function(aChunk){
					if (aChunk instanceof Array && aChunk.length > 0){
						this.setData(aChunk, true); //merge
						
				        //store all your data in the database 
				        //#TODO optimize this by only storing the changed objects: from the retrieved oData, loop and fetch every object by id.
						var aEntries = this.getPropety("/entries");
						this.saveDataToDb(aEntries); 
						
						//progress report
						resolve({
							"success":true, 
							"data":{response:oData, count:aChunk.length, final:false}, 
							"message": "" + aChunk.length + " changedocs have been downloaded for model " + sModelName 
						});
						
				        //store sync properties
				        var oLast = aChunk[aChunk.length];
				        this._dLastdownload = oLast.timestamp;
						this.storeSyncProperties();
						
						fnDownloadChunk();
					}else{
						resolve({
							"success":true, 
							"data":{response:aChunk, count:0, final:true}, 
							"message": "all changes downloaded for model " + sModelName 
						});
					}
				}.bind(this) ;

				//prepare a downloadFailed function
				var fnDownloadFailed = function(oErr){
					reject({"success":false, "data":oErr, "message":"Download new data failed for: " + sUrl });
				}.bind(this) ;

				var fnDownloadChunk = function(){
					//first: get 10 changes arrived on the server since last syncdate in a delta-array
					/*var oGetProm = this.loadData(sUrl, {"since": sSince }, true, "GET", true );*/
					
					var ogetProm = jQuery.get({
					    contentType : "application/json",
					    url : sUrl + "since=" + sSince, //db service will only return 10 results at a time. (safety)
						dataType : "json",
					    data: {since:sSince},
					    async: true
					});  
					oGetProm.done(fnNewDataDownloaded.bind(this) );
					oGetProm.fail(fnDownloadFailed.bind(this));
				}
				
				fnDownloadChunk();
				
        	}.bind(this));

			return oProm;
        };//#TODO split this out in pageable downloads
        
        ObjectModel.prototype.uploadChanges = function( dLastUpload, sModelName ){ 
			//use the settings stored previously
			var sUrl = this.sUrl;
			var dLastSync = dLastUpload  ||  this._dLastUpload ||  new Date(0)
			var sSince = "" + dLastSync;
			var aChanges = this.getChangesSince(dLastSync);
			
			//prepare the url to receive parameters
			if(sUrl.includes("?") ){
				sUrl = "" + sUrl + "&";
			}else{
				sUrl = "" + sUrl + "?";
			}

        	var oPromise = new Promise(function(resolve, reject) {
        		if(!(aChanges instanceof Array)){
        			resolve({"success":true, "data":{count:0, final: true}, "message": "no changes for " + sModelName })
        			return;
        		}
        		
				//prepare a newDataDownloaded function
				var fnNewDataUploaded = function(oData){
					if (aChanges.length > 0){
						resolve({
							"success":true, 
							"data":{response:oData, count:1, final:false}, 
							"message": "1 changedoc has been uploaded for model " + sModelName 
						});
						
						fnUploadChunk()
					}else{
						resolve({
							"success":true, 
							"data":{response:oData, count:1, final:true}, 
							"message": "1 final changedoc has been uploaded for model " + sModelName 
						});
					}
	
			        //store sync properties
			        var oLast = aChunk[aChunk.length];
			        this._dLastUpload = oLast.timestamp;
					this.storeSyncProperties();
					
				}.bind(this) ;
	
				//prepare a downloadFailed function
				var fnUploadFailed = function(oErr){
					reject({"success":false, "data":oErr, "message":"Upload changes failed for: " + sUrl });
				}.bind(this) ;
				
				var fnUploadChunk = function(){
		        	var oChangeDoc = aChanges.shift();
					
					//second, upload change document since last syncdate to server
					jQuery.ajax({
					    type : "POST",
					    contentType : "application/json",
					    url : sUrl + "since=" + sSince,
					    dataType : "json",
					    data: JSON.stringify(oChangeDoc),
					    async: true, 
					    success : fnNewDataUploaded,
					    error : fnUploadFailed
					});
				}.bind(this);
		        	
        		fnUploadChunk();
			}.bind(this) );
			
			return oPromise;
        }; //#TODO: what if a chunk fails? next may only start if previous finishes

        ObjectModel.prototype._createSyncProperties = function(oEvent){ 
		    var db = oEvent.target.result;
		    var store = db.createObjectStore("properties" , {keyPath: "id"});
        };//Create your DB-table from the received data (promise)

        ObjectModel.prototype.loadSyncProperties = function(){
        	var oProm = new Promise(function(resolve, reject){
				var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;// || window.shimIndexedDB;
				if(!indexedDB){ reject( new Error("No indexed DB support"));}
				
				// Open (or create) the database
				var oRequest = indexedDB.open("Sync", 1);

				// Create the schema
				oRequest.onupgradeneeded = this._createSyncProperties.bind(this);

				oRequest.onsuccess = function(oEvent) {
					var oDb = oEvent.target.result;					
					var oTx = oDb.transaction("properties", "readwrite");
					var store = oTx.objectStore("properties");
					var oGetStore = store.get(this.oSettings.store); //get properties for current entity set
					
					oGetStore.onsuccess = function(oEvent){
						if(oEvent.target.result){
							this._dLastDownload = oEvent.target.result._dLastDownload;
							this._dLastUpload = oEvent.target.result.lastUpload;
						}else{
							this._dLastDownload = new Date(0);
							this._dLastUpload = new Date(0);
						}
				    	resolve(oEvent.target.result);
					}.bind(this)
					
					oGetStore.onerror = function(oEvent){
						this._dLastDownload = new Date(0);
						this._dLastUpload = new Date(0);
						reject( new Error("IndexedDb not accessible") );
					}.bind(this)
				
				}.bind(this);	
				
				oRequest.onError = function(oEvent){
					this._dLastDownload = new Date(0);
					this._dLastUpload = new Date(0);
					reject( new Error("IndexedDb not accessible") );
				}.bind(this)
			}.bind(this) );
			
			return oProm;
        	
        };//retrieve the last sync date from the properties db

        ObjectModel.prototype.storeSyncProperties = function(){
        	var oProm = new Promise(function(resolve, reject){
        		if(! this._dLastSync ){
        			this.d_lastSync = new Date(0);
        		}
        		
				var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;// || window.shimIndexedDB;
				if(!indexedDB){ reject( new Error("No indexed DB support"));}
				
				// Open (or create) the database
				var oRequest = indexedDB.open("Sync", 1);

				// Create the schema (if necessary)
				oRequest.onupgradeneeded = this._createSyncProperties.bind(this);

				oRequest.onsuccess = function(oEvent) {
					var oDb = oEvent.target.result;					
					var oTx = oDb.transaction("properties", "readwrite");
					var store = oTx.objectStore("properties");
					
					var oData = {
						"id": this.oSettings.store,
						"lastUpload": this._dLastUpload,
						"lastDownload":this._dLastDownload
					};

					var oPutStore = store.put(oData , oData.id); //or do I need to call, getJSON?
					
					oPutStore.onsuccess = function(oEvent){
				    	resolve(oEvent.target.result);
					}.bind(this)
					
					oPutStore.onerror = function(oEvent){
						reject( new Error("IndexedDb not accessible") );
					}.bind(this)
				}.bind(this);	
				
				oRequest.onError = function(oEvent){
					reject( new Error("IndexedDb not accessible") );
				}.bind(this)
			}.bind(this) );
			
			return oProm;
        };//store the sync properties

		ObjectModel.prototype.onSaveDateToDb = function(oEvent){
			var oObject = oEvent.getParameter("oObject");
			if(oObject)	{
				this.saveDataToDb([oObject]); //save
			}
		};
		
        ObjectModel.prototype.onPropertyUpdated = function(oEvent){
        	var sPath = oEvent.getParameter("path");
        	var oValue = oEvent.getParameter("value");
        	
        	//this.firePropertyChange({Reason:sap.ui.model.ChangeReason.Change, path:sPath, value:oValue});
        	/*this.firePropertyChange({
        		reason:oEvent.getParameter("reason") || sap.ui.model.ChangeReason.Binding, 
        		path:sPath || "/entries",
        		value:oValue,
        		context:oEvent.getParameter("context")
        	});*/
			this.refresh(true); //refresh bindings (refine upto path?)
        };//#TODO: optimize
        
        ObjectModel.ClassConstructor = function () {

        }; //static constructor

        setTimeout(ObjectModel.ClassConstructor.bind(this),1); //statically call the class constructor (after completionof definition)

        return ObjectModel;
    }
);