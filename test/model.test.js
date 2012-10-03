var helper = require("./helper")
  , assert = helper.assert
  , Model  = helper.Model
  , monk   = require("monk");


describe("Model", function(){

  before(function(done){
    Model.DB.driver.db.dropDatabase(done);
  });

  describe("instance", function(){
    var M = new Model("models");
    it("should be a constructor", function(){
      assert.typeOf(M, "function");
    });
    it("should have a reference to the mongodb collection", function(){
      assert.instanceOf(M.collection, monk.Collection);
    });
    describe("instance", function(){
      var m = new M();
      it("should be an instance of M", function(){
        assert.instanceOf(m, M);
      });
    });
  });

  describe("instance w/ schema", function(){
    var c = function(){
      return this.a;
    }

    var schema = {
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

    var M = new Model("models", schema);

    it("should set the schema on the constructor", function(){
      assert.deepEqual(M.schema, schema);
    });

    describe("instance", function(){
      var m = new M();

      it("should apply the schema to the instance", function(){
        assert.equal(m.a, "a");
        assert.equal(m.b, "b");
        assert.equal(m.c, "a");
        assert.instanceOf(m.d, Date);
        assert.isUndefined(m.e);
        assert.equal(m.obj.is, "not a sub schema");
        assert.equal(m.sub.is, "a sub schema");
        assert.isUndefined(m.some_id);

        assert.isUndefined(m.embedded);
        assert.isUndefined(m.embed_nums);
        assert.isUndefined(m.ids);
      });
    });

    describe("instance w/ embedded docs", function(){
      var m = new M({
          embedded: [
              { a: "test" }
            , {}
          ]
        , embed_nums: ["10", "20", 30]
        , ids: ["4e4e1638c85e808431000003", Model.ObjectID("4e4e1638c85e808431000003")]
      });

      it("should apply the embedded schema too", function(){
        assert.equal(m.a, "a");
        assert.equal(m.b, "b");
        assert.equal(m.c, "a");
        assert.instanceOf(m.d, Date);
        assert.isUndefined(m.e);
        assert.equal(m.obj.is, "not a sub schema");
        assert.equal(m.sub.is, "a sub schema");

        assert.isArray(m.embedded);
          assert.equal(m.embedded[0].a, "test");
          assert.equal(m.embedded[0].b, "b");
          assert.equal(m.embedded[0].c, "a");
          assert.instanceOf(m.embedded[0].d, Date);
          assert.isUndefined(m.embedded[0].e);

          assert.equal(m.embedded[1].a, "a");
          assert.equal(m.embedded[1].b, "b");
          assert.equal(m.embedded[1].c, "a");
          assert.instanceOf(m.embedded[1].d, Date);
          assert.isUndefined(m.embedded[1].e);

        assert.isArray(m.embed_nums);
          assert.strictEqual(m.embed_nums[0], 10);
          assert.strictEqual(m.embed_nums[1], 20);
          assert.strictEqual(m.embed_nums[2], 30);

        assert.isArray(m.ids);
          assert.instanceOf(m.ids[0], Model.ObjectID);
          assert.instanceOf(m.ids[1], Model.ObjectID);
      });
    });
  });

  describe("sub model", function(){
    var A = new Model("models", {
      a: "a"
    });

    var test = function(){};

    A.prototype.test = test;

    var B = new Model("models", {
      b: "b"
    }).inherits(A);

    var test2 = function(){};

    B.prototype.test2 = test2;

    it("should inherit the defaults from the parent and merge them", function(){
      assert.deepEqual(B.schema, {a: "a", b: "b"});
    });

    describe("instance", function(){
      var b = new B();

      it("should have the defaults applied", function(){
        assert.deepEqual(b, {a: "a", b: "b"});
      });

      it("should inherit the parent constructor's prototype", function(){
        assert.equal(b.test, test);
      });
      it("should retain its prototype", function(){
        assert.equal(b.test2, test2);
      });

    });
  });

  describe("Operations", function(){

    var A = new Model("a", {
        def: true
      , not_def: false
      , count: Number
    });

    describe("insert", function(){
      var promise
        , a;

      before(function(done){
        promise = A.insert({str: "is a string", not_def: true}, function(error, doc){
          a = doc;
          done();
        });
      });

      it("should return a promise", function(){
        assert.instanceOf(promise, monk.Promise);
      });
      it("should be an instance of the model", function(){
        assert.instanceOf(a, A);
      });

      it("should have an ID", function(){
        assert.isDefined(a._id);
      });
      it("should have the defaults applied", function(){
        assert.equal(a.def, true);
      });
      it("should have its properties applied", function(){
        assert.equal(a.str, "is a string");
      });
      it("should not override the property if set, even with a default", function(){
        assert.equal(a.not_def, true);
      });

    });

    describe("querying", function(){
      var a;

      before(function(done){
        A.insert({str: "it's another string!", count: "1"}, function(error, doc){
          a = doc;
          done();
        });
      });

      describe("find one", function(){
        var promise, a2;

        before(function(done){
          promise = A.findOne({str: a.str}, function(error, doc){
            a2 = doc;
            done();
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, monk.Promise);
        });
        it("should be an instance of the model", function(){
          assert.instanceOf(a2, A);
        });
        it("should cast the values in the correct type", function(){
          assert.strictEqual(a2.count, 1);
        });

      });

      describe("find by Id", function(){
        var promise, a2;

        before(function(done){
          promise = A.findById(a._id, function(error, doc){
            a2 = doc;
            done();
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, monk.Promise);
        });
        it("should be an instance of the model", function(){
          assert.instanceOf(a2, A);
        });

      });

      describe("find and modify", function(){
        var promise, a2;

        before(function(done){
          promise = A.findAndModify({_id: a._id}, {$set: {new_val: "it's new!"}}, {new: true}, function(error, doc){
            a2 = doc;
            done();
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, monk.Promise);
        });
        it("should be an instance of the model", function(){
          assert.instanceOf(a2, A);
        });
        it("should have the new data", function(){
          assert.equal(a2.new_val, "it's new!");
        });
      });
      
      describe("update", function(){
        var promise, a2;

        before(function(done){
          promise = A.update({_id: a._id}, {$set: {test: "it's new!"}}, function(error, updated){
            a2 = updated;
            done();
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, monk.Promise);
        });
        it("should have updated one record", function(){
          assert.strictEqual(a2, 1);
        });
        it("should not be an instance of the model", function(){
          assert.notInstanceOf(a2, A);
        });
      });
    });
  });

  describe("w/ hooks", function(){
    var X = new Model("hooked", {
      def: "some string"
    });

    var x;

    describe("insert", function(){
      var beforeInsert, afterInsert;

      before(function(){
        X.before("insert", function(done){
          beforeInsert = Object.clone(this);
          this.another = "property";
          done();
        });

        X.after("insert", function(done){
          afterInsert = Object.clone(this);
          this.someVirtual = "this is a virtual";
          done();
        });
      });

      before(function (done){
        X.insert({}, function(error, doc){
          x = doc;
          done();
        });
      });

      describe("before", function(){
        it("should have ran the hook", function(){
          assert.equal(x.another, "property");
        });
        it("should not have inserted the document", function(){
          assert.isUndefined(beforeInsert._id);
        });
        it("should not have ran the `after` hook", function(){
          assert.isUndefined(beforeInsert.someVirtual);
        });
      });

      describe("after", function(){
        it("should have ran the hook", function(){
          assert.equal(x.someVirtual, "this is a virtual");
        });
        it("should have inserted the document", function(){
          assert.isDefined(afterInsert._id);
        });
      });

    });

    describe("load", function(){
      var beforeLoad, afterLoad;

      before(function(){
        X.before("load", function(done){
          beforeLoad = this;
          this.changedBefore = true;
          done();
        });

        X.after("load", function(done){
          afterLoad = this;
          this.changedAfter = false;
          done();
        });
      });

      before(function (done){
        X.findById(x._id, function(error, doc){
          x = doc;
          done();
        });
      });

      describe("before", function(){
        it("should have ran the hook", function(){
          assert.equal(x.changedBefore, true);
        });
        it("should be raw data", function(){
          assert.notInstanceOf(beforeLoad, X);
        });
        it("should not have ran the `after` hook", function(){
          assert.isUndefined(beforeLoad.changedAfter);
        });
      });

      describe("after", function(){
        it("should have ran the hook", function(){
          assert.equal(x.changedAfter, false);
        });
        it("should have instantiated the instance", function(){
          assert.instanceOf(afterLoad, X);
        });
      });
    });
  });
});