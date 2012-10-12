var util = require("./util");

/**
 * Schema field constructor.
 * 
 * @param  {String} name Name of the field.
 * @param  {Object} opts Options for the field (type, default, etc.)
 * @return {Field}
 */
var Field = function(name, opts){
  this.name = name;
  if (typeof opts === "function") {
    this.type = opts;
  } else if (Array.isArray(opts)){
    if (opts.length === 1) {
      // Likely an array of embedded docs
      this.isArray = true;
      if (typeof opts[0] === "object")
        this.schema = new Schema(opts[0]);
      // Typed array
      else if (typeof opts[0] === "function")
        this.type = opts[0];
      else {
        delete this.isArray;
        // Just a default array with stuff in it.
        this.type = Array;
        this.default = opts;
      }
    } else {
      // Just a default array with stuff in it.
      this.type = Array;
      this.default = opts;
    }
  } else if (typeof opts === "object") {
    if (typeof opts.type !== "undefined") {
      this.type = opts.type;
      this.default = opts.default;
    } else {
      // Embedded schema
      this.schema = new Schema(opts);
    }
  } else {
    this.default = opts;
  }
  return this;
};

/**
 * Applies the default for a field.
 * 
 * @param  {Mixed} value Value to apply the default on (optional).
 */
Field.prototype._applyDefault = function(value){
  if (Array.isArray(this.default) || typeof this.default !== "function") {
    return this.default;
  } else {
    return this.default(value);
  }
}

/**
 * Casts the right type on a value
 * 
 * @param  {Mixed} value Value to cast the type on.
 * @return {Mixed}       Casted value.
 */
Field.prototype._castType = function(value, partial){
  if (typeof value === "undefined")
    return;

  var newValue;

  if (typeof this.type === "undefined" && this.schema) {
    if (this.isArray) {
      newValue = value.map(function(props){
        return this.schema.cast(props, partial);
      }.bind(this));
    } else {
      newValue = this.schema.cast(value, partial);
    }
  } else if (typeof this.type === "function") {
    if (this.isArray && Array.isArray(value))
      newValue = value.map(this._castType.bind(this));
    else if (!(value instanceof this.type)) {
      switch (this.type) {
        case String:
        case Array:
          newValue = value;
          break;

        case Number:
          newValue = parseInt(value, 10);
          break;

        default:
          newValue = new this.type(value);
          break;
      };
    } else {
      newValue = value;
    }
  } else {
    newValue = value;
  }

  return newValue;
};

/**
 * Casts the value for that field.
 * 
 * @param  {Any} value Provided value for the field.
 * @return {Any}       Casted value.
 */
Field.prototype.cast = function(value, partial){
  if (value === undefined && partial !== true) {
   if (typeof this.default !== "undefined") {
      return this._castType(this._applyDefault(value));
    } else if (this.schema && !this.isArray) {
      var casted = this.schema.cast(value);
      if (Object.keys(casted).length > 0)
        return casted;
    }
  }
  return this._castType(value, partial);
};


/**
 * Schema constructor.
 * 
 * @param  {Object} schema Object describing the schema to construct.
 * @return {Schema}
 */
var Schema = function(schema){
  this.schema = schema;
  this._parse();
  return this;
};

/**
 * Parses the Schema into `Field`s.
 */
Schema.prototype._parse = function() {
  this.fields = {};
  Object.keys(this.schema).forEach(function(key) {
    this.fields[key] = new Field(key, this.schema[key]);
  }.bind(this));
};

/**
 * Casts the schema on an object
 * @param  {Object}  props   Properties to cast the Schema upon.
 * @param  {Boolean} partial Is this a partial implementation of the object?
 * @return {Object}          Object with casted data.
 */
Schema.prototype.cast = function(props, partial) {
  var obj = props && util.clone(props) || {};

  Object.keys(this.fields).forEach(function(key){
    if (util.has(this.fields, key)) {
      var casted = this.fields[key].cast(obj[key], partial);
      if (typeof casted !== "undefined")
        obj[key] = casted;
    }
  }.bind(this));

  return obj;
};

/**
 * Inherit from another Schema.
 * 
 * @param  {Schema} schema Schema to inherit from.
 * @return {Schema}        Merged Schema.
 */
Schema.prototype.inherits = function(schema) {
  Object.keys(schema.schema).forEach(function(name){
    if (typeof this.schema[name] === "undefined")
      this.schema[name] = schema.schema[name];
  }.bind(this));
  this._parse();
  return this;
};


module.exports = Schema;