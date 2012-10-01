var util = require("util");

var model = function (props) {
  if (props){
    Object.keys(props).forEach(function(key){
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        Object.defineProperty(this, key, {value: props[key], enumerable: true});
      }
    }.bind(this));
  }
  if (this.constructor.defaults && (!props || (props && typeof props._id === "undefined"))) {
    var defaults = this.constructor.defaults
    Object.keys(defaults).forEach(function(key){
      if (typeof this[key] === "undefined") {
        var val = typeof defaults[key] === "function" ? defaults[key].apply(this) : defaults[key];
        Object.defineProperty(this, key, {value: val, enumerable: true});
      }
    }.bind(this));
  }
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

var modelize = function(parent, collection, defaults){
  var ctor = function(){
    return parent.apply(this, arguments);
  };

  util.inherits(ctor, parent);

  Object.keys(parent).forEach(function(key){
    if (key === "super_")
      return;
    if (key === "defaults") {
      Object.keys(parent[key]).forEach(function(key){
        if (typeof defaults[key] === "undefined")
          defaults[key] = parent.defaults[key];
      });
    } else if (typeof parent[key] === "function") {
      ctor[key] = function(){
        return parent[key].apply(ctor, arguments);
      };
    } else {
      ctor[key] = parent[key];
    }
  });

  ctor.defaults = defaults;

  ctor.collection = Model.DB.get(collection);

  return ctor;
};

var Model = function(parent, collection, defaults){
  if (typeof parent === "function") {
    return modelize(parent, collection, defaults);
  } else {
    defaults = collection;
    collection = parent;
    return modelize(model, collection, defaults);
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