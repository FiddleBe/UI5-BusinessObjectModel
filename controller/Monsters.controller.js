sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	var MonstersCtrl = Controller.extend("be.fiddle.BusinessObjectModel.controller.Monsters", { });
	
	MonstersCtrl.prototype.getNumberOfChangeRecords = function(oObject){
		return (oObject.changeRecords && oObject.changeRecords.length) || 0;
	};
	
	MonstersCtrl.prototype.onPressAdd = function(oEvent){
		var oItem = oEvent.getParameter("item");
		if (oItem.getKey() === "Dragon"){
			this.addDragon();
		}
	};

	MonstersCtrl.prototype.addDragon = function(){
		var oDragon = this.getView().getModel("monsters").create( {"type":"Dragon" });
		this.getOwnerComponent().getRouter().navTo("Dragon", {"id":oDragon.id });
	};
	
	MonstersCtrl.prototype.onPressItem = function(oEvent){
		var oMonster = oEvent.getParameter("listItem").getBindingContext("monsters").getObject();
		this.getOwnerComponent().getRouter().navTo("Dragon", {"id":oMonster.id});
	};

	MonstersCtrl.prototype.onRouteMatched = function(oEvent, oData){
		var sRoute = oEvent.getParameter("name");
		
		if(sRoute === "Monsters" || sRoute === "None" ){
			//this.getView().getModel("monsters").refresh();
		}
	};
	
	return MonstersCtrl;

});