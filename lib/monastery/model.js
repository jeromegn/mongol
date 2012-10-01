var util = require("util");

var apply_schema = function(obj, props, schema){
  var schema = (schema || this.constructor.schema);

  var value;

  if (typeof props === "object") {
    Object.keys(props).forEach(function(key){
      if (Object.prototype.hasOwnProperty.call(props, key))
        Object.defineProperty(obj, key, {value: props[key], enumerable: true, configurable: true});
    }.bind(this));
  }

  if (!schema)
    return;

  Object.keys(schema).forEach(function(key){
    if (!Object.prototype.hasOwnProperty.call(schema, key))
      return;

    var value = obj[key];

    // If `this` doesn't have this value set, set it.
    if (typeof value === "undefined"){
      if (typeof schema[key] === "object" && typeof schema[key]["default"] !== "undefined") {
        if (typeof schema[key]["default"] === "function")
          value = schema[key]["default"].call(this);
        else
          value = schema[key]["default"];
      }
    }

    if (typeof schema[key] === "object" && typeof schema[key]["type"] === "undefined") {
      // The value is actually a sub-schema.
      value = {};
      apply_schema.bind(this)(value, obj[key], schema[key]);

    } else if ((typeof schema[key]["type"] !== "undefined" || typeof schema[key] === "function") && typeof value !== "undefined") {

      var type = typeof schema[key]["type"] === "undefined" ? schema[key] : schema[key]["type"];

      switch (type) {
        case String:
        case Array:
          break;

        case Number:
          value = parseInt(value, 10);

          break;

        default:
          value = new type(value);
          break;
      }

    } else if (typeof value === "undefined" && typeof schema[key] !== "function") {
      value = schema[key];
    }

    if (typeof value !== "undefined")
      Object.defineProperty(obj, key, {value: value, enumerable: true, configurable: true});
  }.bind(this));


};

var model = function (props) {
  apply_schema.bind(this)(this, props);
  return this;
};

["insert", "find", "findOne", "findById", "update", "updateById", "findAndModify"].forEach(function(operation){
  model[operation] = function(){

    var original_cb = arguments[arguments.length - 1];
    if (operation === "insert"){
      var instance = new this(arguments[0]);
      arguments[0] = instance;
    }
    if (typeof original_cb === "function") {
      arguments[arguments.length - 1] = function(error, data){
        if (error)
          return original_cb.apply(this, [error]);
        if (!data)
          return original_cb.apply(this);

        if (Array.isArray(data)){
          return original_cb.apply(this, [null, data.map(function(doc){
            return new this(doc);
          }.bind(this))]);
        } else if (typeof data !== "number") {
          if (operation === "insert") {
            Object.defineProperty(instance, "_id", {value: data._id, enumerable: true});
            return original_cb.apply(this, [null, instance]);
          } else {
            return original_cb.apply(this, [null, new this(data)]);
          }
        } else {
          return original_cb.apply(this, [null, data]);
        }
      }.bind(this);
    }
    return this.collection[operation].apply(this.collection, arguments);
  }
});

model.create = model.insert;

var modelize = function(parent, collection, schema){
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

  ctor.collection = Model.DB.get(collection);

  return ctor;
};

var Model = function(parent, collection, schema){
  if (typeof parent === "function") {
    return modelize(parent, collection, schema);
  } else {
    schema = collection;
    collection = parent;
    return modelize(model, collection, schema);
  }
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

module.exports = Model;