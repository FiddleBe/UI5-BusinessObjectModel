sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	var MonstersCtrl = Controller.extend("be.fiddle.BusinessObjectModel.controller.Monsters", { });
	
	MonstersCtrl.prototype.onSync = function(oEvent){
		var oMonsterModel = this.getView().getModel("monsters");
		
		oMonsterModel.sync(0,"monsters")
		.then(function(){
			debugger;
		})
		.catch(function(){
			debugger;
		});
	};
	
	MonstersCtrl.prototype.onPressAdd = function(oEvent){
		var oMonster = this.getView().getModel("monsters").create();
		this.getOwnerComponent().getRouter().navTo("Monster", {"id":oMonster.id});
	};
	
	MonstersCtrl.prototype.onItemPress = function(oEvent){
		var oMonster = oEvent.getParameter("listItem").getBindingContext("monsters").getObject();
		this.getOwnerComponent().getRouter().navTo("Monster", {"id":oMonster.id});
	};
	
	return MonstersCtrl;

});