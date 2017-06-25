sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	var SyncView =  Controller.extend("be.fiddle.lib.model.offline.sync.controller.Sync", {

	});
	
    SyncView.prototype.onSync = function (oEvent) {
    	var aSync = this.getView().getModel("sync").getProperty("/entries");
    	
		//for every model
		aSync.forEach(function(oSync){
			var oModel = this.getView().getModel(oSync.sName);
			//sync
			if(oModel){
				oModel.sync();
			}
		}.bind(this));
    };
    
    SyncView.prototype.onClose = function (oEvent) {
    	be.fiddle.lib.model.offline.Sync.oPopover.close(); //#TODO, make this architecturally nicer
    };
    
    SyncView.prototype.onUploadPress = function(oEvent){
    	var oCtx = oEvent.getSource().getBindingContext("sync");
    	var oSync = oCtx.getObject();
    	var sName = oCtx.getProperty("name");
    	var oModel = this.getView().getModel(sName);
    	var oSyncModel = this.getView().getModel("sync");
    	
    	oSync.uploading = true;
    	
    	oModel.uploadChanges(null, sName)
    	.progress(function(oResp){
     		oSync.uploaded += oResp.data.count;
     		oSync.lastUpload = oResp.timestamp;
    		oSyncModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
    	})
    	.done(function(oResp){
    		oSync.uploaded += oResp.data.count;
     		oSync.lastUpload = oResp.timestamp;
    		
    		if(oResp.data.final === true){
    			oSync.uploading = false;
    		}
    		oSyncModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
    	}.bind(this))
    	.fail(function(oResp){
    		oSync.uploading = false;
    		oSyncModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
    	}.bind(this));
    };

    SyncView.prototype.onDownloadPress = function(oEvent){
    	var oCtx = oEvent.getSource().getBindingContext("sync");
    	var oSync = oCtx.getObject();
    	var sName = oCtx.getProperty("name");
    	var oModel = this.getView().getModel(sName);
    	var oSyncModel = this.getView().getModel("sync");
    	
    	oSync.downloading = true;
    	
    	oModel.downloadChanges(null, sName)
    	.progress(function(oResp){
     		oSync.lastDownload = oResp.timestamp;
    		oSync.downloaded += oResp.data.count ;
    		oSyncModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
    	})
    	.done(function(oResp){
     		oSync.lastDownload = oResp.timestamp;
    		oSync.downloaded += oResp.data.count ;
    		
    		if(oResp.data.final === true){
    			oSync.downloading = false;
    		}
    		oSyncModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
    	}.bind(this))
    	.fail(function(oResp){
    		oSync.downloading = false;
    		oSyncModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
    	}.bind(this));
    };
	  
	SyncView.prototype.getProgress = function(iCurrent, iTotal){
		if(iTotal > 0)	{
			return iCurrent / iTotal * 100;
		} else {
			return "100";
		}
	};

	SyncView.prototype.getProgressDisplay = function(iCurrent, iTotal){
		return "" + iCurrent + " / " + iTotal;
	};
		
	return SyncView;
});