process.env.NODE_ENV = "test";
require("sugar");

var assert = require("chai").assert
  , Model  = require("../")("localhost/monastery-tests");

exports.assert = assert;
exports.Model  = Model;
exports.clearDatabase = function(done){
  Model.DB.driver.db.dropDatabase(done)
}
