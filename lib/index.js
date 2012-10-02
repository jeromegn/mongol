var util  = require("./monastery/util")
  , model = require("./monastery/model")
  , Hooks = require("./monastery/hooks")
  , monk  = require("monk");

var Model = function(parent, collection, schema){

  if (typeof parent === "function") {
    var modeled = util.modelize(parent, collection, schema, Model.DB);
  } else {
    schema = collection;
    collection = parent;
    var modeled = util.modelize(model, collection, schema, Model.DB);
  }

  modeled.hooks = new Hooks();
  modeled.before = modeled.hooks.before.bind(modeled.hooks);
  modeled.after = modeled.hooks.after.bind(modeled.hooks);
  return modeled;
};

/**
 * Attaches a monk db instance to the Model
 * @param  {Object}      db Monk db instance
 * @return {Constructor}
 */
Model.withDb = function(db){
  this.DB = db;
  return this;
}

module.exports = function(Model){
  return function(){
    return Model.withDb(monk.apply(this, arguments));
  }
}(Model);