sap.ui.define([
	"sap/ui/core/UIComponent"
], function(UIComponent) {
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

		//prepare the router
		this.getRouter().initialize();
	};

    return Component;

});