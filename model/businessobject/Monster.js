sap.ui.define([
	"be/fiddle/BusinessObjectModel/model/BusinessObject"
], function(BusinessObject) {
	"use strict";

	var Monster = BusinessObject.extend("be.fiddle.BusinessObjectModel.model.businessobject.Monster", {
		constructor: function(oData){
			BusinessObject.prototype.constructor.apply(this, arguments);
		}	
	});
	
	Monster.prototype.save = function(){
		
	};

	Monster.prototype.delete = function(){
		
	};

    Monster.getObject = function(oData){
    	return new Monster(oData);
    };//factory to get the right child object

	return Monster;
});