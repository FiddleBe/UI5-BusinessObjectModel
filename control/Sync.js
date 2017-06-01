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

	    Sync.prototype.init = function () {
	        if (Button.prototype.init) {
	            Button.prototype.init.apply(this, arguments);
	        }
	        //i18n model
	        this.setModel( new sap.ui.model.resource.ResourceModel({bundleName:"be.fiddle.lib.model.offline.sync.i18n.i18n"}), "i18n" );
	        
	        //syncmodel
	        this.setSyncModel();
	        
	        this.oPopover = null;
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
					var aUpload = this.getModel(sName).getChangesSince();
					aEntries.push( {
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
					});
					
					//this isn't optimized, but i need the data in the model, asap.
					this.getModel("sync").setProperty("/entries", aEntries);
					
					//wiat for the server to respond with a count of available downloads
					this.getModel(sName).getDownloadableChangesCount()
					.then(function(oMessage){
						this.getModel("sync").setProperty("/entries/" + i + "/toDownload", oMessage.data ); //is the I here still the right value?
					}.bind(this));
				}
			}
			
	    };

	    Sync.prototype.onOpenSync = function (oEvent) {
	    	if(!this.oPopover){
				this.oPopover = sap.ui.xmlfragment("be.fiddle.lib.model.offline.sync.fragment.Sync");
				this.oPopover.setModel(this.getModel("i18n"), "i18n");
				this.oPopover.setModel(this.getModel("sync"), "sync");
	    	}
			this.oPopover.openBy(oEvent.getSource() );
	    };//open a popover with the sync options and buttons

	    Sync.prototype.onSync = function (oEvent) {
/*	        this.fireSort({ aSync: this.getModel(this.sModel).getProperty(this.sPath) } );
*/
	    };
	    
	    Sync.prototype.onUploadPress = function(oEvent){
	    	var oCtx = oEvent.getSource().getContextBinding("Sync");
	    	var oSync = oCtx.getObject();
	    	var sName = oCtx.getProperty("name");
	    	var oModel = this.getModel(sName);
	    	
	    	oSync.uploading = true;
	    	
	    	oModel.uploadChanges(null, sName)
	    	.then(function(oResp){
	    		oSync.toUpload += (oResp.count * -1);
	    		
	    		if(oResp.final === true){
	    			oSync.uploading = false;
	    		}
	    	}.bind(this))
	    	.catch(function(oResp){
	    		oSync.uploading = false;
	    	}.bind(this));
	    };

	    Sync.prototype.onDownloadPress = function(oEvent){
	    	
	    };

	    Sync.prototype.onCancel = function (oEvent) {
	        if (this.oPopover) {
	            this.oPopover.close();
	        }
	    };//process sort selection and fire

	    Sync.prototype.onClose = function (oEvent) {
	    };//event handler after closing

			
		Sync.prototype.setSyncModel = function(){
			var oSyncModel = new sap.ui.model.json.JSONModel({entries:[]});
			this.setModel(oSyncModel, "sync");
		};

		Sync.getProgress = function(iCurrent, iTotal){
			if(iTotal > 0)	{
				return iCurrent / iTotal * 100;
			} else {
				return "100";
			}
		};

		Sync.getProgressDisplay = function(iCurrent, iTotal){
			return "" + iCurrent + " / " + iTotal;
		};
		
		//sync styling
		jQuery.sap.includeStyleSheet(jQuery.sap.getModulePath("be.fiddle.lib.model.offline") + "/sync/css/SyncStyle.css");

	    return Sync;
	});