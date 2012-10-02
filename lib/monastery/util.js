var util = require("util");

exports.modelize = function(parent, collection, schema, db){
  var ctor = function(){
    return parent.apply(this, arguments);
  };

  util.inherits(ctor, parent);

  Object.keys(parent).forEach(function(key){
    if (key === "super_")
      return;
    if (key === "schema") {
      Object.keys(parent[key]).forEach(function(key){
        if (typeof schema[key] === "undefined")
          schema[key] = parent.schema[key];
      });
    } else if (typeof parent[key] === "function") {
      ctor[key] = function(){
        return parent[key].apply(ctor, arguments);
      };
    } else {
      ctor[key] = parent[key];
    }
  });

  ctor.schema = schema;

  ctor.collection = db.get(collection);

  return ctor;
};