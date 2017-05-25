sap.ui.define([
    "sap/m/Button",
    "sap/m/ButtonRenderer",
],
	function (Button, ButtonRenderer) {
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
	        this.setModel( new sap.ui.model.resource.ResourceModel({bundleName:"be.fiddle.lib.model.offline.Sync.i18n.i18n"}), "i18n" );
	        
	        //syncmodel
	        this.setSyncModel();

	        this.oPopover = null;
	        this.oList = null;

	        this.attachPress(this.onOpenSorting.bind(this));
            this.addItem(new Item() );
	    };

	    Sync.prototype.onModelUpdate = function (oEvent, oParam) {
	    };

	    Sync.prototype.onOpenSync = function (oEvent) {

	    };//open a popover with the sort options and buttons

	    Sync.prototype.onSync = function (oEvent) {
/*	        this.fireSort({ aSync: this.getModel(this.sModel).getProperty(this.sPath) } );

	        if (this.oPopover) {
	            this.oPopover.close();
	        }*/
	    };

	    Sync.prototype.onCancel = function (oEvent) {
	        if (this.oPopover) {
	            this.oPopover.close();
	        }
	    };//process sort selection and fire

	    Sync.prototype.onClose = function (oEvent) {
	    };//event handler after closing

		Sync.prototype.setSyncModel = function(){
			var oModels = this.oPropagatedProperties.oModels;
			var aModelNames = Object.keys(oModels);
			var oSyncModel = new sap.ui.model.JSON.JSONModel({entries:[]});
			
			for(var i = 0; i < aModelNames.length; i++){
				
			}
		};

	    return Sync;
	});