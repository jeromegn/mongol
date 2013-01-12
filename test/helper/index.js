process.env.NODE_ENV = "test";

var assert = require("chai").assert
  , Model  = require("./model");

exports.assert = assert;
exports.Model  = Model;
exports.clearDatabase = function(done){
  Model.db.dropDatabase(done)
}

exports.models  = require("./models");
exports.schemas = require("./schemas");