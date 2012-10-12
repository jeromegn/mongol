var Model   = require("./model")
  , schemas = require("./schemas");

var Full = new Model("full", schemas.full);

var Basic = new Model("basic", schemas.basic);

var Basic2 = new Model("basic", schemas.basic2);
Basic2.prototype.test = function(){};

var Inherited = new Model("inherited", schemas.basic).inherits(Basic2);
Inherited.prototype.test2 = function(){};

var Normal = new Model("normal", schemas.normal);

var CustomID = new Model("custom_id", schemas.customId);

exports.Full = Full;
exports.Basic = Basic;
exports.Basic2 = Basic2;
exports.Inherited = Inherited;
exports.Normal = Normal;
exports.CustomID = CustomID;