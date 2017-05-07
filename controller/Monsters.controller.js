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
	
	return MonstersCtrl;

});