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
			var oParam = oEvent.getParameter("arguments");
			var aMonsters = this.getView().getModel("monsters").getProperty("/entries");
			
			var i = aMonsters.length;
			while(i--){
				if(aMonsters[i].id === oParam.id){
					this.getView().bindElement({path:"/entries/" + i, model:"monsters"});
					this.setViewModel();
					return;
				}
			}
		}
	};
	
	MonsterCtrl.prototype.onPressAdditionalProperty = function(oEvent){
		var aPairs = this.getView().getModel("pairs").getData();
		aPairs.push({key:"", value:"", bKeyEditable:true});
		this.getView().getModel("pairs").setData(aPairs);
	};
	
	MonsterCtrl.prototype.onPressSave = function(oEvent){
		var oMonster = this.getView().getBindingContext("monsters").getObject();
		var aPairs = this.getView().getModel("pairs").getData();
		
		//again, this bit is generic. In reality, you would simply bind the view to the object you are changing; not to some intermediate dynamic model
		aPairs.forEach(function(oPair){
			if(oMonster.setProperty)	{
				if(!oMonster[oPair.key]){
					oMonster[oPair.key] = null; //define it //generic
				}
				oMonster.setProperty(oPair.key, oPair.value); //using setProperty will also update/generate a changeRecord
			}
		});
		
		//this is the true power of the business objects
		if(oMonster.save){
			oMonster.save();
		}
		this.navBack();
	};

	MonsterCtrl.prototype.onPressCancel = function(oEvent){

		var oCtx = this.getView().getBindingContext("monsters");
		if(oCtx){ //possible to get here from dummy url
			var oMonster = oCtx.getObject();
			oCtx.getModel().removeObject( oMonster);
		}
		this.navBack();
	};
	
	MonsterCtrl.prototype.navBack = function(){
		if(window.history.length > 0){
			window.history.back();
		}else{
			this.getOwnerComponent().getRouter().navTo("None");
		}
	};

	MonsterCtrl.prototype.setViewModel = function(oEvent){
		//this is just some generic sample code which will generate a dynamic view model containing all the objects' properties and values
		var oMonster = this.getView().getBindingContext("monsters").getObject();
		if(oMonster.getPropertyPairs){
			var aPairs = oMonster.getPropertyPairs();
			this.getView().setModel(new sap.ui.model.json.JSONModel(aPairs),"pairs");
		}
	};
	
	return MonsterCtrl;
});