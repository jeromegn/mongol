var Model = require("./monastery/model")
  , monk = require("monk");

module.exports = function(Model){
  return function(){
    return Model.withDb(monk.apply(this, arguments));
  }
}(Model);