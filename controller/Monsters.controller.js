sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	var MonstersCtrl = Controller.extend("be.fiddle.BusinessObjectModel.controller.Monsters", { });
	
	MonstersCtrl.prototype.getNumberOfChangeRecords = function(oObject){
		return (oObject.changeRecords && oObject.changeRecords.length) || 0;
	};
	
	MonstersCtrl.prototype.onPressAdd = function(oEvent){
		var oMonster = this.getView().getModel("monsters").create();
		this.getOwnerComponent().getRouter().navTo("Monster", {"id":oMonster.id});
	};
	
	MonstersCtrl.prototype.onPressItem = function(oEvent){
		var oMonster = oEvent.getParameter("listItem").getBindingContext("monsters").getObject();
		this.getOwnerComponent().getRouter().navTo("Monster", {"id":oMonster.id});
	};

	MonstersCtrl.prototype.onRouteMatched = function(oEvent, oData){
		var sRoute = oEvent.getParameter("name");
		
		if(sRoute === "Monsters" || sRoute === "None" ){
			//this.getView().getModel("monsters").refresh();
		}
	};
	
	return MonstersCtrl;

});