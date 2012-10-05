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

exports.inheritsConstructor = function(parent, ctor){
  ctor = ctor || function(){
    return parent.apply(this, arguments);
  };

  util.inherits(ctor, parent);

  Object.keys(parent).forEach(function(key){
    if (typeof ctor[key] === "undefined") {
      if (typeof parent[key] === "function") {
        ctor[key] = function(){
          return parent[key].apply(ctor, arguments);
        };
      } else {
        ctor[key] = parent[key];
      }
    }
  });

  return ctor;
}