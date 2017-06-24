sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	var ShellCtrl = Controller.extend("be.fiddle.BusinessObjectModel.controller.Shell", {
		constructor:function(){
			Controller.prototype.constructor.apply(this,arguments);
		}
	});
	
	ShellCtrl.prototype.onAfterRendering = function(oEvent){
		var oToolPage = this.getView().byId("monsterShell");
		oToolPage.setSideExpanded( false );	
		this._oLogin = sap.ui.xmlfragment("be.fiddle.BusinessObjectModel.fragment.Logon", this);
		this.getView().addDependent(this._oLogin);
	};
	
	ShellCtrl.prototype.onExit=function(){
		this._oLogin.destroy();	
	};

	ShellCtrl.prototype.onToggleMenu = function(oEvent){
		var oToolPage = this.getView().byId("monsterShell");
		oToolPage.setSideExpanded( oEvent.getSource().getPressed() );		
	};
	
	ShellCtrl.prototype.onNavPress = function(oEvent) {
		var oMenu = oEvent.getParameter('item');
		switch(oMenu.getKey()){
			case "":
				break;
			case "Login":
				this._oLogin.openBy(oMenu );
				break;
			default:
				this.getOwnerComponent().getRouter().navTo(oMenu.getKey() );
		}
	};
	
	ShellCtrl.prototype.onLogin = function(oEvent){
		var sUser = this.getView().byId("inpUser");
		var sPass = this.getView().byId("inpPass");
		
		var oXhr =$.get({
			url: "/service/db.php?entity=monsters&logon",
			headers: {
    			"Authorization": "Basic " + btoa(sUser + ":" + sPass)
			}
		})
		.done(function(){
			sap.m.MessageToast.show("Authenticated");
		})
		.fail(function(){
			sap.m.MessageToast.show("ERROR: you're not allowed in");
		});
	};
	
	return ShellCtrl;

});