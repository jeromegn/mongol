var model = require("./monastery/model")
  , monk  = require("monk");

// Monastery takes care of casting (or not) the _id.
var oldId = monk.Collection.prototype.id;
monk.Collection.prototype.id = monk.Collection.prototype.oid = function(str){
  try {
    return oldId.call(this, str);
  } catch (error) {
    return str;
  }
};

module.exports = function(){
  var Model = function(collection, schema){
    return model.build.call(model, collection, schema, Model.db)
  };

  Model.db = monk.apply(this, arguments);
  Model.ObjectID = Model.db.driver.ObjectID;

  return {
    Model: Model
  }
};