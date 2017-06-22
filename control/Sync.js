sap.ui.define([
    "sap/m/Button",
    "sap/m/ButtonRenderer",
    "be/fiddle/BusinessObjectModel/model/BusinessObjectModel"
],
	function (Button, ButtonRenderer, BusinessObjectModel) {
	    "use strict";

	    var Sync = Button.extend("be.fiddle.lib.model.offline.Sync", {

	        "metadata": {
	            "properties": {
	                "title": { type: "string", defaultValue: "Sync" },
                    "ok": { type: "string", defaultValue: "ok" },
                    "cancel": { type: "string", defaultValue: "cancel" }
	            },
	            "aggregations": {
	            },
	            "events": {
	                "uploadFinished": {
	                    parameters: {
	                        sModel: { type: "string" },
	                        iObjects : {type:"int"}
	                    }
	                },
	                "uploadStarted": {
	                    parameters: {
	                        sModel: { type: "string" },
	                        iObjects : {type:"int"}
	                    }
	                },
	                "downloadStarted": {
	                    parameters: {
	                        sModel: { type: "string" },
	                        iObjects : {type:"int"}
	                    }
	                },
	                "downloadFinished": {
	                    parameters: {
	                        sModel: { type: "string" },
	                        iObjects : {type:"int"}
	                    }
	                },
	                "progress":{
	                	parameters:{
	                		sModel:{type:"string"},
	                		iObjects : {type:"int"},
	                		bUp:{type:"boolean"}
	                	}
	                },
	                "cancel": {
	                    parameters: {}
	                }
	            }
	        },

	        "renderer": function (oRm, oControl) {
	            ButtonRenderer.render(oRm, oControl);
	        }
	    });
	    
		Sync.prototype.destroy = function(){
			if(be.fiddle.lib.model.offline.Sync.oPopover){
				be.fiddle.lib.model.offline.Sync.oPopover.destroy();
			}
			Button.prototype.destroy.apply(this,arguments);
		}
		
	    Sync.prototype.init = function () {
	        if (Button.prototype.init) {
	            Button.prototype.init.apply(this, arguments);
	        }
	        //i18n model
	        this.setModel( new sap.ui.model.resource.ResourceModel({bundleName:"be.fiddle.lib.model.offline.sync.i18n.i18n"}), "i18n" );
	        
	        //syncmodel
	        this.setSyncModel();
	        
	        if(!this.oPopover){
				be.fiddle.lib.model.offline.Sync.oPopover = sap.ui.xmlfragment("be.fiddle.lib.model.offline.sync.fragment.Sync");
				be.fiddle.lib.model.offline.Sync.oPopover.setModel(this.getModel("i18n"), "i18n");
				be.fiddle.lib.model.offline.Sync.oPopover.setModel(this.getModel("sync"), "sync");
	    	}

	        this.attachPress(this.onOpenSync.bind(this));
	        this.attachModelContextChange({}, this.onModelUpdate, this);
	    };

	    Sync.prototype.onModelUpdate = function (oEvent, oParam) {
			var oModels = this.oPropagatedProperties.oModels;
			var aModelNames = Object.keys(oModels);
			var aEntries = [];
			
			for(var i = 0; i < aModelNames.length; i++){
				var sName = aModelNames[i];
				if(this.getModel(sName) instanceof BusinessObjectModel){
					
					be.fiddle.lib.model.offline.Sync.oPopover.setModel(this.getModel(sName),sName ); //all models must also be attached to the popover
					
					var aUpload = this.getModel(sName).getChangesSince();
					var oSyncEntry = {
						"name":sName,
						"uploadCollection":aUpload,
						"toUpload":aUpload.length,
						"uploaded":0,
						"uploading":false,
						"lastUpload":this.getModel(sName).getLastUpload(),
						"toDownload":0,
						"downloaded":0,
						"downloading":false,
						"lastDownload":this.getModel(sName).getLastDownload()
					}
					aEntries.push( oSyncEntry );
					
					//wiat for the server to respond with a count of available downloads
					this.getModel(sName).getDownloadableChangesCount()
					.then(function(oMessage){
						oSyncEntry.toDownload = oMessage.data.count ; 
						this.getModel("sync").refresh(true);
					}.bind(this));
				}
			}

			this.getModel("sync").setProperty("/entries", aEntries);
	    };

	    Sync.prototype.onOpenSync = function (oEvent) {
	    	this.onModelUpdate(); //#TODO I don't like it that we have to call this here. I would have preferred that the onModelUpdate were an event handler after model changes
			be.fiddle.lib.model.offline.Sync.oPopover.open(oEvent.getSource() );
	    };//open a popover with the sync options and buttons

		Sync.prototype.setSyncModel = function(){
			var oSyncModel = new sap.ui.model.json.JSONModel({entries:[]});
			this.setModel(oSyncModel, "sync");
			return oSyncModel;
		};
		
		//sync styling
		jQuery.sap.includeStyleSheet(jQuery.sap.getModulePath("be.fiddle.lib.model.offline") + "/sync/css/SyncStyle.css");

	    return Sync;
	});
