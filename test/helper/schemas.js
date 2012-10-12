var Model = require("./model");

var c = function(value){
  return "test";
}

exports.full = {
    a: "a"
  , b: "b"
  , c: {type: String, default: c}
  , d: {type: Date, default: Date.now}
  , e: Array
  , obj: {
      is: "not a sub schema"
    }
  , sub: {
      is: { type: String, default: "a sub schema" }
    }
  , some_id: Model.ObjectID
  , embedded: [
      {
          a: "a"
        , b: "b"
        , c: {type: String, default: c}
        , d: {type: Date, default: Date.now}
        , e: Array
      }
    ]
  , embed_nums: [Number]
  , ids: [Model.ObjectID]
}

exports.basic = {a: "a"};
exports.basic2 = {b: "b"};

exports.normal = {
    def: true
  , not_def: false
  , count: Number
}

exports.customId = {
    _id: String
  , other_prop: "prop"
}