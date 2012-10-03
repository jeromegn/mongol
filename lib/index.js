var model = require("./monastery/model")
  , monk  = require("monk");

var Model = function(collection, schema){
  this.collection = collection;
  this.schema = schema;
  this.modeled = model.build(collection, schema, Model.DB);
  return this.modeled;
};

/**
 * Attaches a monk db instance to the Model
 * @param  {Object}      db Monk db instance
 * @return {Constructor}
 */
Model.withDb = function(db){
  this.DB = db;
  this.ObjectID = db.driver.ObjectID
  return this;
}

module.exports = function(Model){
  return function(){
    return Model.withDb(monk.apply(this, arguments));
  }
}(Model);