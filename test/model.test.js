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

  describe("instance w/ defaults", function(){
    var c = function(){
      return this.a;
    }

    var M = new Model("models", {
        a: "a"
      , b: "b"
      , c: c
    });

    it("should set those defaults to the constructor", function(){
      assert.deepEqual(M.defaults, {
          a: "a"
        , b: "b"
        , c: c
      });
    });

    describe("instance", function(){
      var m = new M();
      it("should apply the defaults to the instance", function(){
        assert.deepEqual(m, {
            a: "a"
          , b: "b"
          , c: "a"
        });
      });
    });
  });

  describe("sub model", function(){
    var A = new Model("models", {
      a: "a"
    });

    var test = function(){};

    A.prototype.test = test;

    var B = new Model(A, "models", {
      b: "b"
    });

    var test2 = function(){};

    B.prototype.test2 = test2;

    it("should inherit the defaults from the parent and merge them", function(){
      assert.deepEqual(B.defaults, {a: "a", b: "b"});
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
    });

    describe("using callbacks", function(){
      describe("create", function(){
        var promise
          , a;

        before(function(done){
          promise = A.create({str: "is a string"}, function(error, doc){
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

      });

      describe("querying", function(){
        var a;

        before(function(done){
          A.create({str: "it's another string!"}, function(error, doc){
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

    describe("using promises", function(){

      describe("create", function(){
        
        var a;

        before(function(done){
          var create = A.create({})
          create.on("success", function(doc){
            a = doc;
            done();
          });
        });

        it("should be an instance of the model", function(){
          assert.instanceOf(a, A);
        });

      });

    });
  });
});