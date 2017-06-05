/**
 * @Author Tom Van Doorslaer
 * base business object
 * the business object can contain API's and properties related to a business object (duh)
 * The cool thing is that you can bind a busines object to an object model 
 * the objectmodel is an extension of the DB model. So normally you define it via the manifest
 * in the settings object, you add the name of the template class (full name)
 * every entry in the model is then automatically converted into a businessobject instance
 * since the business object contains a getproperty, setproperty and all the individual properties of the original dataobject....:
 * happy days!
 * 
 * One more thing: a business object can be a traditional CRUd based object, meaning that a single record is a single object
 * But it can also be a timesliced CR model, in which your base object is nothing but an id and a collection of change records
 * {id:1, changeRecords:[{timestamp:0, name:"tom", age:"30"},{timestamp:1, name:"Tom", work:"developer"}]}
 * In this latter case, the change records will be stored as an array, but they will also be aggregated to form the root object
 * {id:1, name:"Tom", age:"30", work:"developer", ... }
**/
sap.ui.define([
        "sap/ui/base/EventProvider" //test the managedObject instead of EventProvider
],
function (BaseObject) {
    "use strict";

    /*---------------------------------------instance ------------------------------------------------------*/
    var BusObj = BaseObject.extend("be.fiddle.BusinessObjectModel.model.BusinessObject", {
		metadata:{
			events:{
				"propertyUpdated":{
					parameters:[
						{name:"path"},
						{name:"reason"},
						{name:"value"},
						{name:"context",optional:"true"}
						]
				},
				"saveRequested":{
					parameters:[{name:"oObject"}]
				}
			}
		},
		
        constructor: function (oData) {
            //instance constructor
            BaseObject.prototype.constructor.apply(this, arguments);

			//process the base data
			this.setProperty("/", oData, true);
           
            //process the timeslices
            if(this.changeRecords){
            	this.sortChangeRecords();
				this.applyChangeRecords();
            } //I must not instantiate changerecords here, if there are none provided by the service
            
            this._oPrevState = this.getJSON(); //keep the previous state
        }
    });
    
    BusObj.prototype.isThisYou = function(oObject){
    	if( oObject.id === this.id ){
    		return true;
    	}
    	else return false;
    };
    
    BusObj.prototype.generateChangeRecord = function(){
    	if(!this.changeRecords) return; //no changerecords provided by service, don't bother generating any.
    	
    	var oChangeRecord = this.changeRecords[this.changeRecords.length - 1] || {};
    	var bReuse = false;
    	
    	//if there is an unsaved changerecord available at the end of the list, continue on that one, else begin a new one.
    	if(oChangeRecord && oChangeRecord._stored){
    		oChangeRecord = {} ; //begin new changerecord if previous is already stored	
    	} else if (this.changeRecords.length > 0 ){ //there are changerecords present, and we're using the last one
    		bReuse = true;
    	}
    	
    	//#TODO: what about deep properties? use getProperty and getPrevState?
        for (var key in this) {
            if (typeof this[key] !== "function" 			//do not include methods
            	&& BaseObject.prototype[key] === undefined  //don't include the properties of the superior object.
            	&& key !== "_oPrevState"					//don't include the internal previous state
            	&& key !== "mEventRegistry"					//don't include the internal previous state
            	&& !( this[key] instanceof Array )			//avoind including changerecords in the changerecord...
            ) {
                if(this[key] !== this._oPrevState[key]){
                	oChangeRecord[key] = this[key];
                }
            }
        }
        
        if(oChangeRecord){
        	oChangeRecord.timestamp = new Date(); //since this is still a reference, in theory, the array should be updated now as well
        	
        	if(!bReuse){
				this.addChangeRecord(oChangeRecord);
        	}
        }
    };//will compare previous state, with current state, generate and append a changerecord based on differences

	BusObj.prototype.getChangesSince = function(dLastSync){
    	if(! (this.changeRecords instanceof Array) || this.changeRecords.length === 0) return this.getJSON() ; //no changedocs, just return self-blob
		
		var aChanges = [];
		//process every record //reverse loop
		var i = this.changeRecords.length;
		while(i--){
			if( this.changeRecords[i].timestamp >= dLastSync){
				aChanges.push(this.changeRecords[i]);
			}else{
				break; //changes are already sorted in time, so if the date is before the last sync, stop searching
			}
		}
		return aChanges;
	};
	
    BusObj.prototype.getJSON = function () {
        var oJSON = {};

        for (var key in this) {
            if (typeof this[key] !== "function" 			//do not include methods
            	&& BaseObject.prototype[key] === undefined  //don't include the properties of the superior object.
            	&& key !== "_oPrevState"					//don't include the internal previous state
            	&& key !== "mEventRegistry"
            ) { //must also include changerecords, since it's used to save to db
                oJSON[key] = this[key];
            }
        }

        return $.extend({}, oJSON,{} ); //make sure you return a copy, not a reference
    };

	BusObj.prototype.getPreviousState = function(sPath){
		try{
			var oPrev = this.getProperty("/_oPrevState/" + sPath);
			
			return oPrev;
		}catch (e){
			return null;
		}
	};
	
    BusObj.prototype.getProperty = function (sPath) {
        var aParts = sPath.split("/");
        var oProp = this;

        for (var i = 0; i < aParts.length; i++) {
            if (aParts[i] && aParts[i] !== "") {
                if (oProp && oProp[aParts[i]] !== "undefined") {
                    oProp = oProp[aParts[i]];
                }
                else {
                    throw "Property " + sPath + " does not exist";
                }
            }
        }
        return oProp;
    };
    
    BusObj.prototype.getPropertyPairs = function(){
    	var aPair = [];

        for (var key in this) {
            if (typeof this[key] !== "function" 		//do not include methods
            	&& !( this[key] instanceof Array )
            	&& BaseObject.prototype[key] === undefined  //don't include the properties of the superior object.
            	&& key !== "mEventRegistry"
            	&& !key.startsWith("_")
            ) {
    			var oPair = {"key":null, "value":null, "bKeyEditable":false}; //has to be in the loop, otherwise you keep updating references reused in each row
                oPair.key = key;
                oPair.value = this[key];
                aPair.push(oPair);
            }
        }
    	
    	return aPair;
    };

    BusObj.prototype.setProperty = function (sPath, oValue, bSkipAsChange) {
        var aParts = sPath.split("/");
        var oProp = this;
        var sPropName = "";

        for (var i = 0; i < aParts.length ; i++) { 
            if ( (aParts[i] && aParts[i] !== "") && i < (aParts.length - 1)) {
                if (oProp) {
                    oProp = oProp[aParts[i]]; //hopefully, this actually creates the property if needed
                }
                else {
                    throw "Property " + sPath + " does not exist";
                }
            }
            if (oProp && i === (aParts.length - 1)) {
            	sPropName = aParts[i];
            	break;
            }
        }
        
		//this is where we'll actually start updating properties
		if(oValue instanceof Array){
			this._setObjectsOfArray(oProp, aParts[i], oValue, sPath, bSkipAsChange );
		}else if(oValue instanceof Object){
			this._setPropertiesOfObject(oProp, aParts[i], oValue, sPath, bSkipAsChange );
		}else {
			this._setProperty(oProp, aParts[i], oValue, sPath, bSkipAsChange );
		}
    };
    
    BusObj.prototype._setObjectsOfArray = function (oObject, sKey, aData, sPath, bSkipAsChange){
    	if(sKey && sKey !== ""){
    		oObject[sKey] = []; //first set an initial array
    	} else{
    		throw "rootpath may not be an array!";
    	}
    	
    	for(var i = 0; i < aData.length; i++){
			this._setPropertiesOfObject(oObject[sKey][i], "/" + i , aData[i], sPath + "/" + sKey + "/" + i, bSkipAsChange );
    	}
    };

    BusObj.prototype._setPropertiesOfObject = function (oObject, sKey, oData, sPath, bSkipAsChange){
    	if(sKey && sKey !== ""){
        	for(var key in oData){
				this._setProperty(oObject[sKey], key, oData[key], sPath + "/" + sKey, bSkipAsChange );
        	}
    	}else{
        	for(var key in oData){
				this._setProperty(oObject, key, oData[key], sPath + "/" + sKey, bSkipAsChange );
        	}
    	}
    	
    };

    BusObj.prototype._setProperty = function (oObject, sKey, vData, sPath, bSkipAsChange){
    	if(sKey && sKey !== ""){
        	oObject[sKey] = vData;
        	
            if(this.getPreviousState(sPath) !== vData ){
	            if(!bSkipAsChange){
	            	//update the current change record with the changes (or start a new changerecord if none is available)
	            	this.generateChangeRecord();
	            }
            
            	//fire an event to indicate that this property has updated
				this.fireEvent("propertyUpdated", {
					reason:sap.ui.model.ChangeReason.Binding,
					path:sPath, 
					value:vData}
				);
            }

            //and log
            jQuery.sap.log.debug("Property " + sPath + " updated with value " + vData );
    	}
    };

    BusObj.prototype.sortChangeRecords = function(){
    	if(! (this.changeRecords instanceof Array) ) return; //not an array
    	
		//sort the change records by timestamps
		this.changeRecords.sort(function(a,b){ 
			if(a.timestamp < b.timestamp){
				return -1;
			}
			if(a.timestamp > b.timestamp){
				return 1;
			}
			
			return 0;
		});
    }; //changerecords must always be sorted by timestamp (ascending)

    BusObj.prototype.addChangeRecords = function(aChangeRecords){
		if(!this.changeRecords){
			this.changeRecords = [];
		}
		
		//process every record
		for(var i = 0; i < aChangeRecords.length; i++){
			this.addChangeRecord(aChangeRecords[i]);
		}
		this.sortChangeRecords();
		this.applyChangeRecords()
    }; //changerecords must always be sorted by timestamp (ascending)

    BusObj.prototype.addChangeRecord = function(oChangeRecord){
    	if(!this.changeRecords){
    		this.changeRecords = [];
		}
    	
    	/* can't quite remember the idea behind this logic. I think it was to avoid duplicate changerecords
    	for(var i = 0; i<this.changeRecords.length; i++){
    		var oRecord = this.changeRecords[i];
    		if(oRecord.timestamp === oChangeRecord.timestamp ){
    			//check the stringified json as well.
    			//theoretically, two changes can happen at exactly the same time
    			if(JSON.stringify(oRecord) === JSON.stringify(oChangeRecord)){
    				//skip this record
    				break;
    			}
    		}
			this.changeRecords.push(oChangeRecord);
    	}
    	*/
		this.changeRecords.push(oChangeRecord);

	    //fire an event to indicate that this property has updated
		this.fireEvent("propertyUpdated", {
			reason:sap.ui.model.ChangeReason.Binding,
			path:"changeRecords", 
			value:this.changeRecords
		});
		return;
    }; //changerecords must always be sorted by timestamp (ascending)

    BusObj.prototype.applyChangeRecords = function(){
    	if(! (this.changeRecords instanceof Array) ) return; //not an array

		//process every record
		for(var i = 0; i < this.changeRecords.length; i++){
			for (var key in this.changeRecords[i] ) {
				this.setProperty(key, this.changeRecords[i][key], true);
			}
		}
    }; //changerecords must always be sorted by timestamp (ascending)

	BusObj.prototype.attachPropertyUpdated = function(oData, fnHandler, oListener ){
		this.attachEvent("propertyUpdated", null, fnHandler, oListener)	;
	};

	BusObj.prototype.detachPropertyUpdated = function(oData, fnHandler, oListener ){
		this.detachEvent("propertyUpdated", fnHandler, oListener)	;
	};

	BusObj.prototype.attachSaveRequested = function(oData, fnHandler, oListener ){
		this.attachEvent("saveRequested", null, fnHandler, oListener)	;
	};

	BusObj.prototype.detachSaveRequested = function(oData, fnHandler, oListener ){
		this.detachEvent("saveRequested", fnHandler, oListener)	;
	};

	BusObj.prototype.save = function(){
		this.generateChangeRecord();
		this.fireEvent("saveRequested", {oObject:this}); //treated in the dbmodel
	};
	
	BusObj.prototype.onSaveComplete = function(oEvent){
		if(this.changeRecords && this.changeRecords.length > 0){
			var oLastChange = this.changeRecords[this.changeRecords.length - 1];
			oLastChange._stored = true;		//mark as stored
		}
		this._oPrevState = this.getJSON();	//set new state
	};

	BusObj.prototype.onSaveFailed = function(oEvent){
		jQuery.sap.log.Error("ERROR Saving entity monster", this);
	};

    //static constructor
    BusObj.ClassConstructor = function () {

    };
    
    BusObj.getObject = function(oData){
    	return new BusObj(oData);
    };//factory to get the right child object

    //statically call the class constructor
    setTimeout( BusObj.ClassConstructor, 1); //to prevent the constructor from running before the BusinessObject is defined

    return BusObj;
});