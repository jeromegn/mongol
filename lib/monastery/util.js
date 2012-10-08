var util = require("util");

/**
 * Clones the properties of an Object into an empty Object.
 * 
 * @param  {Object} obj Object to clone.
 * @return {Object}     Cloned object.
 */
exports.clone = function(obj){
  var new_obj = {};
  if (typeof obj === "object")
    Object.keys(obj).forEach(function(key){
      if (Object.prototype.hasOwnProperty.call(obj, key))
        new_obj[key] = obj[key];
    });
  return new_obj;
}

/**
 * Inherits everything from a constructor.
 * 
 * @param  {Function} parent Constructor to build from.
 * @param  {Function} ctor   Constructor to apply to (optional).
 * @return {Function}        Merged constructor.
 */
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