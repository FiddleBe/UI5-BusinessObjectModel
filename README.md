# UI5-BusinessObjectModel
A new BusinessObjectModel for UI5 apps

The ui5 businessobject model is an extension of UI5's json model, but with a couple of added layers.
- offline storage of data via indexeddb
- every entity in the model can be an instance of a business object of you choice. (a bese businessobject is available for you to extend)
- introduction of changeRecords (using timeslices)
- Built-in synchronization mechanisms.

The essence of the BOM can be found in the model-folder and the manifest.json file in this project.
the businessobject example can be found under /model/businessobject/Monster.js and /model/businessobject/monster/Dragon.js (subtypes)

The entire application is just one big showcase of what you can do with a BOM (although not exhaustive)

In the control folder, you can also find a very convenient sync control, which you can include on any view, with a single statement. this control is not yet entirely finished, but there will be more fixes in the coming months.

The server side is just a simple generic PHP service handler, which allows you to store anything in a table with blob-content.

You can see the showcase running on https://businesobjectmodel.fiddle.be
try not to screw it up. Please.
