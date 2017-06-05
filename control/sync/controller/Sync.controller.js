sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	var SyncView =  Controller.extend("be.fiddle.lib.model.offline.sync.controller.Sync", {

	});
	
    SyncView.prototype.onSync = function (oEvent) {
/*	    this.fireSort({ aSync: this.getModel(this.sModel).getProperty(this.sPath) } );
*/
    };
    
    SyncView.prototype.onUploadPress = function(oEvent){
    	var oCtx = oEvent.getSource().getBindingContext("sync");
    	var oSync = oCtx.getObject();
    	var sName = oCtx.getProperty("name");
    	var oModel = this.getView().getModel(sName);
    	
    	oSync.uploading = true;
    	
    	oModel.uploadChanges(null, sName)
    	.then(function(oResp){
    		oSync.toUpload += (oResp.count * -1);
    		
    		if(oResp.final === true){
    			oSync.uploading = false;
    		}
    		oModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
    	}.bind(this))
    	.catch(function(oResp){
    		oSync.uploading = false;
    		oModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
    	}.bind(this));
    };

    SyncView.prototype.onDownloadPress = function(oEvent){
    	var oCtx = oEvent.getSource().getBindingContext("sync");
    	var oSync = oCtx.getObject();
    	var sName = oCtx.getProperty("name");
    	var oModel = this.getView().getModel(sName);
    	
    	oSync.downloading = true;
    	
    	oModel.downloadChanges(null, sName)
    	.then(function(oResp){
    		oSync.toDownload += (oResp.count * -1);
    		
    		if(oResp.final === true){
    			oSync.downloading = false;
    		}
    		oModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
    	}.bind(this))
    	.catch(function(oResp){
    		oSync.downloading = false;
    		oModel.setProperty(oCtx.getPath(), oSync); //update modelbindings
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