sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	var ShellCtrl = Controller.extend("be.fiddle.BusinessObjectModel.controller.Shell", {
		constructor:function(){
			Controller.prototype.constructor.apply(this,arguments);
		}
	});
	
	ShellCtrl.prototype.onToggleMenu = function(oEvent){
		var oToolPage = this.getView().byId("monsterShell");
		oToolPage.setSideExpanded( oEvent.getSource().getPressed() );		
	};
	
	ShellCtrl.prototype.onNavPress = function(oEvent) {
		var oMenu = oEvent.getParameter('item');
		if(oMenu.getKey() && oMenu.getKey !== "" ){
			this.getOwnerComponent().getRouter().navTo(oMenu.getKey() );
		}
	};
	
	return ShellCtrl;

});