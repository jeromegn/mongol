var model = require("./monastery/model")
  , monk  = require("monk");

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