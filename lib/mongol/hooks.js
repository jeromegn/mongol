var Async = require('async');

var SUPPORTED_EVENTS = ["load", "insert", "update", "remove"];

/**
 * `before` and `after` hooks ran in parallel
 */
var Hooks = function(){
  this._before = {};
  this._after = {};
  SUPPORTED_EVENTS.forEach(function(event){
    this._before[event] = [];
    this._after[event]  = [];
  }.bind(this));
  return this;
}

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
  var count = 0 // starts at 1 because the waterfall callback counts
    , waterfall_done = false;
  
  var done = function(error){
    if (error && callback)
      callback(error);
    else if (count === 0 && waterfall_done === true && callback)
      callback();
  };

  var funcs = this["_"+when][event].map(function(fn){
    if (fn.length === 0) {
      return function(next){
        try {
          if (fn.call(instance) === false) {
            process.nextTick(function(){
              next(new Error("Hook "+ (fn.name + " " || "") +"returned false"));
            });
          } else {
            process.nextTick(next);
          }
        } catch(error) {
          process.nextTick(function(){
            next(error);
          });
        }
      }
    } else if (fn.length === 1) {
      return fn.bind(instance);
    } else if (fn.length === 2) {
      count++;
      return function(next){
        fn.call(instance, next, function(){
          count--;
          done.apply(this, arguments);
        });
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
  Hooks.prototype[when] = function(event, callback){
    this._register.call(this, when, event, callback);
  }
});

module.exports = Hooks;