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

	Monster.prototype.delete = function(){
		
	};

    Monster.getObject = function(oData){
    	return new Monster(oData);
    };//factory to get the right child object

	return Monster;
});