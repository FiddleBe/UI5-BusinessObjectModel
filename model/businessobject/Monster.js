sap.ui.define([
	"be/fiddle/BusinessObjectModel/model/BusinessObject"
], function(BusinessObject) {
	"use strict";

	var Monster = BusinessObject.extend("be.fiddle.BusinessObjectModel.model.businessobject.Monster", {
		constructor: function(oData){
			BusinessObject.prototype.constructor.apply(this, arguments);
			
			//monsters are changerecord sensitive (I know, since I built the service)
			if(!this.changeRecords){
				this.changeRecords = [];
			}
		}	
	});
	
	Monster.prototype.save = function(){
		BusinessObject.prototype.save.apply(this, arguments);
	};

	Monster.prototype.setPicture = function(sDataUrl){
		this.setProperty("picture",sDataUrl);
	};

    //static constructor
    Monster.ClassConstructor = function () {
		sap.ui.require(["be/fiddle/BusinessObjectModel/model/businessobject/monster/Dragon"],
		function(Dragon){
			//nothing special here, just making sure we load our child-definitions
		});
    };
    
    Monster.getObject = function(oData){
    	switch(oData.type){
    		case "Dragon":
    			return be.fiddle.BusinessObjectModel.model.businessobject.monster.Dragon.getObject(oData);
    		default:
		    	return new Monster(oData);
    	}
    };//factory to get the right child object

    //statically call the class constructor
    setTimeout( Monster.ClassConstructor, 0); //to prevent the constructor from running before the BusinessObject is defined

	return Monster;
});