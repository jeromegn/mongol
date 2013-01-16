var util    = require("./util")
  , Promise = require("rsvp").Promise
  , Schema  = require("./schema")
  , Hooks   = require("./hooks")
  , Async   = require('async');

/**
 * Generic Model instance constructor
 * 
 * @param  {Object} props    Properties to assign to this instance.
 * @param  {Boolean} partial Is the instance complete (has all its fields)?
 * @return {model}           Model instance.
 */
var model = function (props, partial) {
  var casted = this.constructor.schema.cast(props, partial);

  Object.defineProperty(this, "__original__", {enumerable: false, writable: true, value: {}});

  Object.keys(casted).forEach(function(key){
    if (util.has(casted, key))
      this._set(key, casted[key]);
  }.bind(this));

  this.constructor.hooks._call("after", "load", this);
  Object.defineProperty(this, "isNew", {enumerable: false, get: function(){
    return typeof this._id === "undefined";
  }});

  return this;
};

/**
 * Sets a property on the instance (when its loaded).
 * 
 * @param {String} key   Name of the field.
 * @param {Mixed}  value Value of the field.
 * @api private
 */
model.prototype._set = function(key, value){
  this[key] = this["__original__"][key] = value;
};

/**
 * Gets the delta of the changes on an object since its original load.
 * 
 * @return {Object} Object representing the changes to the instance.
 */
model.prototype._getDelta = function(){
  var delta = {};
  Object.keys(this).forEach(function(key){
    if (util.has(this, key)) {
      if (this[key] !== this["__original__"][key])
        delta[key] = this[key];
    }
  }.bind(this));
  return delta;
};

/**
 * Update an instance with a MongoDB query.
 * 
 * @param  {Object}   query    Query to execute on the collection.
 * @param  {Function} callback Callback when the instance has been updated in the collection.
 * @return {Promise}
 */
model.prototype.update = function(query, callback){

  var promise = new Promise();

  if (callback)
    promise.on("complete", callback);

  this.constructor.updateById(this._id, query, function (error, updated){
    if (error)
      return promise.reject(error);

    promise.resolve(updated);
    if (callback)
      callback(error, updated)

  }.bind(this));

  return promise;
};

/**
 * Reloads an instance with the latest data in the collection.
 * 
 * @param  {Function} callback Callback for when the instance has been reloaded.
 * @return {Promise}
 */
model.prototype.reload = function(callback){
  var promise = new Promise();

  this.constructor.findById(this._id, function(error, doc){
    if (error)
      return promise.reject(error)
    else if (!doc)
      return promise.reject("Could not find record to reload")
    if (doc) {
      // Remove all the keys from the current instance
      Object.keys(this).forEach(function(key){
        delete this[key];
      }.bind(this));
      // Assign the updated keys
      Object.keys(doc).forEach(function(key){
        if (util.has(doc, key))
          this._set(key, doc[key]);
      }.bind(this));
    }
    promise.resolve(doc)
    if (callback)
      callback(error, doc)

  }.bind(this));

  return promise;
}

/**
 * `insert`s or `update`s the instance.
 * 
 * @param  {Function} callback Callback for when the instance has been saved.
 * @return {Promise}
 */
model.prototype.save = function(callback){
  var promise = new Promise();
  

  if (typeof this._id !== "undefined") {
    var $set = {};
    Object.keys(this).forEach(function(key){
      if (util.has(this, key) && key !== "_id")
        $set[key] = this[key];
    }.bind(this));
    this.constructor.update({_id: this._id}, {$set: $set}, {upsert: true}, function(error){
      if (error)
        promise.reject(error)
      else
        promise.resolve()
      if (callback)
        callback(error, this)
    }.bind(this));
  } else {
    this.constructor.insert(this, function(error, doc){
      if (error)
        promise.reject(error)
      else
        promise.resolve(doc)
      if (callback)
        callback(error, doc)
    }.bind(this));
  }

  return promise;
}

/**
 * Removes the instance from the collection.
 * If removal is successful, the `_id` is deleted from the instance.
 * 
 * @param  {Function} callback Callback for when the instance has been removed.
 * @return {Promise}
 */
model.prototype.remove = function(callback){
  var promise = new Promise();

  this.constructor.hooks._call("before", "remove", this, function(error){
    if (error) {
      if (callback)
        callback(error)
      return promise.reject(error);
    }

    this.constructor.remove({_id: this._id}, function (error, removed){
      if (error) {
        if (callback)
          callback(error)
        return promise.reject(error);
      }

      delete this._id;

      promise.resolve(this);
      if (callback)
        callback(error, this);
      this.constructor.hooks._call("after", "remove", this);
    
    }.bind(this));
  }.bind(this));

  return promise;
};

/**
 * Define and drop indexes.
 * See monk's equivalent methods.
 */
["createIndex", "ensureIndex", "indexInformation", "dropIndex", "dropIndexes"].forEach(function (operation){
  model[operation] = function(){
    var args = arguments
      , promise = new Promise()
      , original_cb = args[args.length - 1];

    var callback_position = typeof original_cb === "function" ? args.length - 1 : args.length;
    args.length = callback_position + 1;

    args[callback_position] = function (error, data){
      if (error) {
        if (typeof original_cb === "function")
          original_cb(error)
        return promise.reject(error)
      }

      promise.resolve(data);
      if (typeof original_cb === "function")
        original_cb(error, data)
    }

    this.collection[operation].apply(this.collection, args);

    return promise;
  };
});

// Sugar.
model.index = model.ensureIndex;


/**
 * Loads an instance.
 * 
 * @param  {Object}    props    Properties to assign to the instance.
 * @param  {Function}  callback Callback for when the instance has been loaded.
 * @param  {Boolean}   partial  Is this a partial instance or a full one?
 * @api    private
 */
model._load = function(props, callback, partial){
  if (props instanceof this)
    return process.nextTick(function(){callback(null, props)});
  
  this.hooks._call("before", "load", props, function(error){
    callback(error, new this(props, partial));
  }.bind(this));
};

/**
 * Inserts a document and instantiates it.
 * Takes the same arguments as monk's `insert`
 * 
 * @return {Promise}
 */
model.insert = function(){
  var args = arguments
    , promise = new Promise()
    , original_cb = args[args.length - 1];

  this._load(args[0], function(error, instance){
    if (error) {
      if (typeof original_cb === "function")
        original_cb(error)
      return promise.reject(error)
    }

    args[0] = instance;

    this.hooks._call("before", "insert", instance, function(error){
      if (error) {
        if (typeof original_cb === "function")
          original_cb(error)
        return promise.reject(error)
      }

      args[args.length - 1] = function(error, data){
        if (error) {
          if (typeof original_cb === "function")
            original_cb(error)
          return promise.reject(error)
        }

        instance._id = data[0]._id;

        promise.resolve(instance);
        if (typeof original_cb === "function")
          original_cb(error, instance)

        this.hooks._call("after", "insert", instance);

      }.bind(this);

      this.collection["insert"].apply(this.collection, args);
    }.bind(this));

  }.bind(this));

  return promise;
};


/**
 * Finds one or more documents and instantiates them.
 * Takes the same arguments as the equivalent method in monk.
 * 
 * @return {Promise}
 */
["find", "findOne", "findById"].forEach(function(operation){
  model[operation] = function (query, options, callback){
    var args = arguments
      , promise = new Promise()
      , original_cb = args[args.length - 1]
      , has_fields;

    if (options && typeof options !== "function") {
      var parsed_options = util.options(options);
      if (parsed_options.fields)
        has_fields = true;
    }

    if (typeof original_cb === "function") {
      args[args.length - 1] = function(error, data){
        if (error) {
          if (typeof original_cb === "function")
            original_cb(error)
          return promise.reject(error)
        }

        if (data) {
          if (operation === "find"){
            data.toArray(function(error, docs){
              Async.map(docs, function(doc, next){
                this._load(doc, next, has_fields);
              }.bind(this), function(error, docs){
                if (error) {
                  if (typeof original_cb === "function")
                    original_cb(error)
                  return promise.reject(error)
                }
                promise.resolve(docs);
                if (typeof original_cb === "function")
                  original_cb(error, docs)
              });
            }.bind(this));
          } else {
            this._load(data, function(error, instance){
              if (error) {
                if (typeof original_cb === "function")
                  original_cb(error)
                return promise.reject(error)
              }
              promise.resolve(instance)
              if (typeof original_cb === "function")
                original_cb(error, instance)
            }.bind(this), has_fields);
          }
        } else {
          promise.resolve(data);
          if (typeof original_cb === "function")
            original_cb(error, data)
        }
      }.bind(this)
    }

    this.collection[operation].apply(this.collection, args);

    return promise;
  };
});

/**
 * Updates as document.
 * Takes the same arguments as the equivalent method in monk.
 * 
 * @return {Promise}
 */
["update", "updateById", "findAndModify"].forEach(function(operation){
  model[operation] = function (search, query, options, callback){
    var args = arguments
      , promise = new Promise()
      , original_cb = args[args.length - 1];

    if (typeof original_cb === "function") {
      args[args.length - 1] = function(error, data){
        if (error) {
          original_cb(error)
          return promise.reject(error)
        }
        
        if (data && typeof data !== "number") {
          return this._load(data, function(error, instance){
            
            if (error) {
              original_cb(error)
              return promise.reject(error)
            }
            promise.resolve(instance)
            original_cb(error, instance)
          
          }.bind(this));
        } else {
          promise.resolve(data);
          original_cb(error, data);
        }

      }.bind(this);
    }

    this.collection[operation].apply(this.collection, args);

    return promise;
  }
});

/**
 * Removes a document.
 * Takes the same arguments as the equivalent method in monk.
 * 
 * @return {Promise}
 */
model.remove = function(){
  var args = arguments
    , promise = new Promise()
    , original_cb = args[args.length - 1];

  this.collection["remove"](arguments[0], function(error, count){
    if (error) {
      if (typeof original_cb === "function")
        original_cb(error)
      return promise.reject(error)
    }
    promise.resolve(count)
    if (typeof original_cb === "function")
      original_cb(error, count)
  })

  return promise;
};

/**
 * Sugar method for the Model's hooks' `before`
 */
model.before = function(){
  this.hooks.before.apply(this.hooks, arguments)
};

/**
 * Sugar method for the Model's hooks' `after`
 */
model.after = function(){
  this.hooks.after.apply(this.hooks, arguments)
};

/**
 * Build a new Model.
 * 
 * @param  {String}   collection Collection name for the Model.
 * @param  {Object}   schema     Raw schema description for the Model's instances.
 * @param  {Database} db         monk's MongoDB database instance.
 * @return {Model}
 */
model.build = function(collection, schema, db){
  var modeled = util.inheritsConstructor(model);
  schema = (schema || {});
  if (!schema._id)
    schema._id = db.ObjectID;
  modeled.schema = new Schema(schema);
  modeled.collection = db.collection(collection);
  modeled.hooks = new Hooks();
  return modeled;
}

/**
 * Inherits everything but the hooks from another Model.
 * 
 * @param  {Model} M Model to inherit from
 * @return {Model}
 */
model.inherits = function(M){
  var modeled = util.inheritsConstructor(M, this);
  if (M.schema)
    this.schema.inherits(M.schema);
  this.hooks = new Hooks();
  return this;
}

module.exports = model;