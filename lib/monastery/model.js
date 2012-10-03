var util = require("./util")
  , Promise = require("monk").Promise
  , Hooks   = require("./hooks")
  , Async   = require('async');

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
  apply_schema.call(this, this, props);
  this.constructor.hooks._call("after", "load", this);
  return this;
};

["insert", "find", "findOne", "findById", "update", "updateById", "findAndModify", "remove"].forEach(function(operation){
  model[operation] = function(){

    var args = arguments
      , promise = new Promise(operation, this.collection)
      , original_cb = args[args.length - 1];
    
    if (operation === "insert")
      args[0] = new this(args[0]);

    var final_cb = function(error, data, hook_event){
      promise.fulfill.apply(promise, [error, data]);

      if (!error && hook_event) {
        this.hooks._call("after", hook_event, data);
      }
    }

    var callback = function(hook_event){
      if (typeof original_cb === "function") {
        args[args.length - 1] = function(error, data){
          
          if (typeof data !== "undefined") {

            if (Array.isArray(data)){

              Async.map(function(doc, done){
                this.hooks._call("before", "load", doc, function(hook_error){
                  done(hook_error, new this(doc));
                });
              }.bind(this), function(async_error, docs){
                final_cb.call(this, error, docs, hook_event);
              });

            } else if (typeof data !== "number") {

              if (operation === "insert") {
                Object.defineProperty(args[0], "_id", {value: data._id, enumerable: true});
                final_cb.call(this, error, args[0], hook_event);
              } else {
                this.hooks._call("before", "load", data, function(hook_error){
                  final_cb.call(this, error, new this(data), hook_event);
                }.bind(this));
              }

            } else {
              final_cb.call(this, error, data, hook_event);
            }
          }

        }.bind(this);

        promise.on("complete", original_cb);

        this.collection[operation].apply(this.collection, args);
      }
    }.bind(this);

    switch (operation) {
      case "insert":
        this.hooks._call("before", "insert", args[0], function(error){
          if (error)
            return promise.fulfill.apply(promise, arguments);
          callback.call(this, "insert");
        }.bind(this));
        break;

      case "update":
      case "findAndModify":
        this.hooks._call("before", "update", args[0], function(error){
          if (error)
            return promise.fulfill.apply(promise, arguments);
          callback.call(this, "update");
        }.bind(this));
        break;

      case "remove":
        this.hooks._call("before", "remove", args[0], function(error){
          if (error)
            return promise.fulfill.apply(promise, arguments);
          callback.call(this, "remove");
        }.bind(this));
        break;

      default:
        callback.call(this);
        break;

    };

    return promise;
  }
});

model.build = function(collection, schema, db){
  var modeled = util.merge(model, collection, schema, db);
  Hooks.setup(modeled);
  return modeled;
}

model.includes = function(M){
  var modeled = util.merge(M, this.collection.name, this.schema, this.db);
  Hooks.setup(modeled);
  return modeled;
}

module.exports = model;