sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	var DragonCtrl = Controller.extend("be.fiddle.BusinessObjectModel.controller.Dragon", { });
	
	DragonCtrl.prototype.onInit = function(){
		this._oRouter = this.getOwnerComponent().getRouter();
		this._oRouter.attachRoutePatternMatched(this.onRouteMatched, this);
	};
	
	DragonCtrl.prototype.onRouteMatched = function(oEvent, oData){
		var sRoute = oEvent.getParameter("name");
		
		if(sRoute === "Dragon"){
			var oParam = oEvent.getParameter("arguments");
			var oModel = this.getView().getModel("monsters");
			
			oModel.onDataLoaded().then(function(){
				var aMonsters = this.getView().getModel("monsters").getProperty("/entries");
				
				var i = aMonsters.length;
				while(i--){
					if(aMonsters[i].id === oParam.id){
						this.getView().bindElement({path:"/entries/" + i, model:"monsters"});
						//this.setViewModel();
						return;
					}
				}
			}.bind(this));
		}
	};
	
	DragonCtrl.prototype.onPressSave = function(oEvent){
		var oMonster = this.getView().getBindingContext("monsters").getObject();
		oMonster.save();
		
		this.navBack();
	};

	DragonCtrl.prototype.onPressCancel = function(oEvent){

		var oCtx = this.getView().getBindingContext("monsters");
		if(oCtx){ //possible to get here from dummy url
			var oMonster = oCtx.getObject();
			oCtx.getModel().removeObject( oMonster);
		}
		this.navBack();
	};
	
	DragonCtrl.prototype.navBack = function(){
		if(window.history.length > 0){
			window.history.back();
		}else{
			this.getOwnerComponent().getRouter().navTo("None");
		}
	};

	DragonCtrl.prototype.setViewModel = function(oEvent){
		//this is just some generic sample code which will generate a dynamic view model containing all the objects' properties and values
		var oMonster = this.getView().getBindingContext("monsters").getObject();
		if(oMonster.getPropertyPairs){
			var aPairs = oMonster.getPropertyPairs();
			this.getView().setModel(new sap.ui.model.json.JSONModel(aPairs),"pairs");
		}
	};
	
	DragonCtrl.prototype.getObjectAsJSON = function(oObject){
		var oLocal = $.extend({},oObject);
		if(oLocal.picture){
			oLocal.picture = oLocal.picture.substr(0, 30) + "...";
		}
		return JSON.stringify(oLocal);
	};

	DragonCtrl.prototype.onLastSeenPress = function(oEvent){
		oEvent.getSource().getBindingContext("monsters").getObject().addSighting();
	};
	
	DragonCtrl.prototype.onFileSelected = function(oEvent){
		var aFiles = oEvent.getParameter("files");
		var oReader = new FileReader();
		debugger;	
		
	    oReader.onload = function(oFile) { 
			this.getView().getBindingContext("monsters").getObject().setPicture(oFile.target.result);
	    }.bind(this);
	    
	    oReader.readAsDataURL(aFiles[0]);
	};

	DragonCtrl.prototype.onShowHistory = function(oEvent){
		var oDyn = this.getView().byId("dragonDetail");
		oDyn.setShowSideContent(!oDyn.getShowSideContent());
		//this.getView().byId("dragonDetail").toggle(  );
	};
	
	return DragonCtrl;
});