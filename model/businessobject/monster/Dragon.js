sap.ui.define([
	"be/fiddle/BusinessObjectModel/model/businessobject/Monster"
], function(Monster) {
	"use strict";

	var Dragon = Monster.extend("be.fiddle.BusinessObjectModel.model.businessobject.monster.Dragon", {
		constructor: function(oData){
			Monster.prototype.constructor.apply(this, arguments);
		}	
	});
	
	Dragon.prototype.addSighting = function(){
		navigator.geolocation.getCurrentPosition(function(oPos){
			this.longitude = oPos.coords.longitude;
			this.latitude = oPos.coords.latitude;
			this.save();
		}.bind(this))
	};

    Dragon.getObject = function(oData){
    	return new Dragon(oData);
    };//factory to get the right child object

	return Dragon;
});