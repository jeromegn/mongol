var model = require("./mongol/model")
  , mongo = require("mongoskin");

module.exports = function(serverURLs, dbOptions, replicasetOptions){
  var Model = function(collection, schema){
    return model.build.call(model, collection, schema, Model.db)
  };

  // Make sure MongoDB has written before calling a callback
  if (dbOptions && typeof dbOptions.safe === "undefined")
    dbOptions.safe = true;
  else if (!dbOptions)
    dbOptions = {safe: true};

  Model.db = mongo.db.call(this, serverURLs, dbOptions, replicasetOptions);
  Model.ObjectID = Model.db.ObjectID;

  return {
    Model: Model
  }
};