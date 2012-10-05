var util    = require("./util")
  , Promise = require("monk").Promise
  , Schema  = require("./schema")
  , Hooks   = require("./hooks")
  , Async   = require('async');

var model = function (props) {
  var casted = this.constructor.schema.cast(props);

  Object.keys(casted).forEach(function(key){
    if (Object.prototype.hasOwnProperty.call(casted, key))
      this[key] = casted[key];
  }.bind(this));

  this.constructor.hooks._call("after", "load", this);
  Object.defineProperty(this, "isNew", {enumerable: false, get: function(){
    return typeof this._id === "undefined";
  }});
  return this;
};

model.load = function(props, callback){
  if (props instanceof this)
    return process.nextTick(function(){callback(null, props)});
  
  this.hooks._call("before", "load", props, function(error){
    callback(error, new this(props));
  }.bind(this));
};

model.insert = function(){
  var args = arguments
    , promise = new Promise(this.collection, "insert")
    , original_cb = args[args.length - 1];

  this.load(args[0], function(error, instance){
    if (error)
      return promise.fulfill.call(promise, error);

    args[0] = instance;

    if (typeof original_cb === "function")
      promise.on("complete", original_cb);

    this.hooks._call("before", "insert", instance, function(error){
      if (error)
        return promise.fulfill.call(promise, error);

      if (typeof original_cb === "function") {
        args[args.length - 1] = function(error, data){
          if (error)
            return promise.fulfill.call(promise, error);
          
          instance._id = data._id;
          promise.fulfill.call(promise, error, instance);
          this.hooks._call("after", "insert", instance);
        }.bind(this);

      }

      this.collection["insert"].apply(this.collection, args);
    }.bind(this));

  }.bind(this));

  return promise;
};

["find", "findOne", "findById"].forEach(function(operation){
  model[operation] = function (query, options, callback){
    var args = arguments
      , promise = new Promise(this.collection, operation)
      , original_cb = args[args.length - 1];

    if (typeof original_cb === "function") {
      args[args.length - 1] = function(error, data){
        if (error)
          return promise.fulfill.call(promise, error);

        if (data) {
          if (Array.isArray(data)){
            Async.map(this.load, function(error, docs){
              promise.fulfill.call(promise, error, docs);
            });
          } else {
            this.load(data, promise.fulfill.bind(promise));
          }
        } else {
          promise.fulfill.call(promise, error, data);
        }

      }.bind(this);

      promise.on("complete", original_cb);
    }

    this.collection[operation].apply(this.collection, args);

    return promise;
  };
});

["update", "updateById", "findAndModify"].forEach(function(operation){
  model[operation] = function (search, query, options, callback){
    var args = arguments
      , promise = new Promise(this.collection, operation)
      , original_cb = args[args.length - 1];

    if (typeof original_cb === "function") {
      args[args.length - 1] = function(error, data){
        if (error)
          return promise.fulfill.call(promise, error);
        
        if (data && typeof data !== "number")
          return this.load(data, promise.fulfill.bind(promise));
        
        promise.fulfill.call(promise, error, data);

      }.bind(this);

      promise.on("complete", original_cb);
    }

    this.collection[operation].apply(this.collection, args);

    return promise;
  }
});

model.remove = function(){
  return this.collection["remove"].apply(this.collection, arguments);
}

model.prototype.update = function(props, callback){
  var promise = new Promise(this.constructor.collection, "update");

  var options = { new: true };

  if (callback)
    promise.on("complete", callback)

  var modifiers = props;
  if (typeof modifiers["$set"] === "undefined")
    modifiers = {$set: modifiers};

  this.constructor.hooks._call("before", "update", this, function(error){
    if (error)
      return promise.fulfill.call(promise, error);

    this.constructor.collection.findAndModify({_id: this._id}, modifiers, options, function (error, updated){
      if (error)
        return promise.fulfill.call(promise, error);

      if (!updated)
        return promise.fulfill.call(promise, new Error("Document with id "+this._id+" couldn't be found for update."));

      Object.keys(updated).forEach(function(key){
        if (Object.prototype.hasOwnProperty.call(updated, key))
          this[key] = updated[key];
      }.bind(this));

      promise.fulfill.call(promise, error, this);
      this.constructor.hooks._call("after", "update", this);

    }.bind(this));
  }.bind(this));

  return promise;
};

model.prototype.save = function(callback){
  var promise = new Promise(this.constructor.collection, "save");
  
  if (callback)
    promise.on("complete", callback)
  
  if (this.isNew) {
    this.constructor.insert(this, promise.fulfill.bind(promise));
  } else {
    var obj = {};
    Object.keys(this).forEach(function(key){
      if (Object.prototype.hasOwnProperty.call(this, key) && key !== "_id")
        obj[key] = this[key];
    })
    this.update(obj, promise.fulfill.bind(promise));
  }
}

model.prototype.remove = function(callback){
  var promise = new Promise(this.constructor.collection, "remove");

  if (callback)
    promise.on("complete", callback)

  this.constructor.hooks._call("before", "remove", this, function(error){
    if (error)
      return promise.fulfill.call(promise, error);

    this.constructor.remove({_id: this._id}, function(error, removed){
      if (error)
        return promise.fulfill.call(promise, error);
      if (removed !== 1)
        return promise.fulfill.call(promise, new Error("Document with id "+this._id+" couldn't be found for removal."));

      delete this._id;

      promise.fulfill.call(promise, error, this);
      this.constructor.hooks._call("after", "remove", this);
    
    }.bind(this));
  }.bind(this));

  return promise;
};

model._setupHooks = function(modeled){
  modeled.hooks = new Hooks();
  modeled.before = modeled.hooks.before.bind(modeled.hooks);
  modeled.after = modeled.hooks.after.bind(modeled.hooks);
};

model.build = function(collection, schema, db){
  var modeled = util.inheritsConstructor(model);
  modeled.schema = new Schema(schema)
  modeled.collection = db.get("collection")
  this._setupHooks(modeled);
  return modeled;
}

model.inherits = function(M){
  util.inheritsConstructor(M, this);
  if (M.schema)
    this.schema.inherits(M.schema);
  this._setupHooks(this);
  return this;
}

module.exports = model;