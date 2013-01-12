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
};

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
};

/**
 * Check if an object has a property defined
 * 
 * @param  {Object}  obj Object to check against.
 * @param  {String}  key Name of the key to check for.
 * @return {Boolean}
 */
exports.has = function(obj, key){
  return Object.prototype.hasOwnProperty.call(obj, key);
};


// -- FROM MONK --

/**
 * Parses all the possible ways of expressing fields.
 *
 * @param {String|Object|Array} fields
 * @return {Object} fields in object format
 * @api public
 */

exports.fields = function (obj) {
  if (!Array.isArray(obj) && 'object' == typeof obj) {
    return obj;
  }

  var fields = {};
  obj = 'string' == typeof obj ? obj.split(' ') : (obj || []);

  for (var i = 0, l = obj.length; i < l; i++) {
    if ('-' == obj[i][0]) {
      fields[obj[i].substr(1)] = 0;
    } else {
      fields[obj[i]] = 1;
    }
  }

  return fields;
};

/**
 * Parses an object format.
 *
 * @param {String|Array|Object} fields or options
 * @return {Object} options
 * @api public
 */

exports.options = function (opts) {
  if ('string' == typeof opts || Array.isArray(opts)) {
    return { fields: exports.fields(opts) };
  }
  opts = opts || {};
  opts.fields = exports.fields(opts.fields);
  return opts;
};