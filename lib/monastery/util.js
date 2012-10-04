var util = require("util");

exports.clone = function(obj){
  var new_obj = {};
  if (typeof obj === "object")
    Object.keys(obj).forEach(function(key){
      if (Object.prototype.hasOwnProperty.call(obj, key))
        new_obj[key] = obj[key];
    });
  return new_obj;
}

exports.merge = function(parent, collection, schema, db){
  var ctor = function(){
    return parent.apply(this, arguments);
  };

  util.inherits(ctor, parent);

  var new_schema = exports.clone(schema);

  Object.keys(parent).forEach(function(key){
    if (key === "super_")
      return;
    if (key === "schema") {
      var cloned_schema = exports.clone(parent[key]);
      Object.keys(cloned_schema).forEach(function(key){
        if (typeof new_schema[key] === "undefined")
          new_schema[key] = cloned_schema[key];
      });
    } else if (typeof parent[key] === "function") {
      ctor[key] = function(){
        return parent[key].apply(ctor, arguments);
      };
    } else {
      ctor[key] = parent[key];
    }
  });

  ctor.schema = new_schema;
  ctor.db = db;
  ctor.collection = db.get(collection);

  return ctor;
};