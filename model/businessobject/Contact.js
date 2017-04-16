sap.ui.define([
	"be/fiddle/BusinessObjectModel/model/BusinessObject"
], function(BusinessObject) {
	"use strict";

	var Contact = BusinessObject.extend("be.fiddle.BusinessObjectModel.model.BusinessObject.Contact", {
		constructor: function(oData){
			BusinessObject.prototype.constructor.apply(this, arguments);
		}	
	});
	
	Contact.prototype.save = function(){
		
	};

	Contact.prototype.delete = function(){
		
	};

	return Contact;
});