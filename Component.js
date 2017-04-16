sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"be/fiddle/BusinessObjectModel/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	var Component = UIComponent.extend("be.fiddle.BusinessObjectModel.Component", {		
		metadata: {
			manifest: "json"
		},

        constructor:function(){
            UIComponent.prototype.constructor.apply(this, arguments);            
        }
    });

	Component.prototype.init = function() {
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
	};

    return Component;

});