sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	var MonsterCtrl = Controller.extend("be.fiddle.BusinessObjectModel.controller.Monster", { });
	
	MonsterCtrl.prototype.onInit = function(){
		this._oRouter = this.getOwnerComponent().getRouter();
		this._oRouter.attachRoutePatternMatched(this.onRouteMatched, this);
	};
	
	MonsterCtrl.prototype.onRouteMatched = function(oEvent, oData){
		var sRoute = oEvent.getParameter("name");
		
		if(sRoute === "Monster"){
			debugger;
			var oParam = oEvent.getParameter("arguments");
			var aMonsters = this.getView().getModel("monsters").getProperty("/entries");
			
			var i = aMonsters.length;
			while(i--){
				if(aMonsters[i].id === oParam.id){
					this.getView().setBinding("/entries/" + i, "monsters");
					return;
				}
			}
		}
	};
	
	MonsterCtrl.prototype.onPressSave = function(oEvent){
		var oMonster = this.getView().getBindingContext("monsters").getObject();
		if(oMonster.save){
			oMonster.save();
		}
	};

	MonsterCtrl.prototype.onPressCancel = function(oEvent){

		var oCtx = this.getView().getBindingContext("monsters");
		var oMonster = oCtx.getObject();
		
		oCtx.getModel().removeObject(oMonster);
		window.history.go(-1);
	};
	
	return MonsterCtrl;
});