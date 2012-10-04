var Async = require('async');

var SUPPORTED_EVENTS = ["load", "insert", "update", "remove"];

/**
 * `before` and `after` hooks ran in parallel
 */
var Hooks = function(){
  return this;
}

Hooks.setup = function(model){
  model.hooks = new Hooks();
  model.before = model.hooks.before.bind(model.hooks);
  model.after = model.hooks.after.bind(model.hooks);
};

/**
 * Register a new hook
 * @param  {String}   when     Moment to run the hook ("before" or "after").
 * @param  {String}   event    Event name of the hook (ie: insert, find, update).
 * @param  {Function} callback Callback when the hook is done (assuming async).
 */
Hooks.prototype._register = function(when, event, callback){
  if (SUPPORTED_EVENTS.indexOf(event) !== -1)
    this["_" + when][event].push(callback);
};


/**
 * Call a hook
 * @param  {String}   when     Moment in the lifecycle.
 * @param  {String}   event    Event name for the hook.
 * @param  {Object}   instance Instance to bind to for the hook functions.
 * @param  {Function} callback Callback for when all hooks have ran.
 */
Hooks.prototype._call = function(when, event, instance, callback){
  console.log("_call hook: %s %s", when, event);
  
  var count = 0
    , waterfall_done = false;
  
  var done = function(error){
    if (error)
      return callback(error);
    
    if (count !== 0)
      count--;

    if (count === 0 && waterfall_done === true && callback)
      callback()
  };

  var funcs = this["_"+when][event].map(function(fn){
    if (fn.length === 0) {
      return function(next){
        if (fn.call(instance) === false) {
          process.nextTick(function(){
            next(new Error("Hook "+ (fn.name + " " || "") +"returned false"));
          });
        } else {
          process.nextTick(next);
        }
      }
    } else if (fn.length === 1) {
      return fn.bind(instance);
    } else if (fn.length === 2) {
      count++;
      return function(next){
        fn.call(instance, next, done);
      }
    }
  });

  if (funcs.length === 0){
    if (callback)
      process.nextTick(callback);
    return;
  }

  Async.waterfall(funcs, function(error){
    waterfall_done = true;
    done(error);
  });
};

/**
 * General purpose sugar functions for before and after hook definition
 *
 * Hooks.prototype.before
 * Hooks.prototype.after
 * 
 * @param  {String}   event    Event name for the hook (maps to a DB operation).
 * @param  {Function} callback Callback when the hook processing is completed.
 */
["before", "after"].forEach(function(when){
  Hooks.prototype["_" + when] = {};
  SUPPORTED_EVENTS.forEach(function(event){
    Hooks.prototype["_" + when][event] = [];
  });
  Hooks.prototype[when] = function(event, callback){
    this._register(when, event, callback);
  }
});

module.exports = Hooks;