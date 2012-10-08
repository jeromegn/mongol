var helper = require("./helper")
  , assert = helper.assert
  , Model  = helper.Model
  , monk   = require("monk");


describe("Model", function(){

  before(helper.clearDatabase);

  var M = new Model("models");

  it("should be a constructor", function(){
    assert.typeOf(M, "function");
  });
  it("should have a reference to the mongodb collection", function(){
    assert.instanceOf(M.collection, monk.Collection);
  });

  describe("with schema", function(){
    var M = new Model("models", helper.schemas.full);

    it("should set the schema on the constructor", function(){
      assert.deepEqual(M.schema.schema, helper.schemas.full);
    });
  });

  describe("inherited", function(){
    var A = helper.models.Basic;
    var B = helper.models.Inherited;

    it("should inherit the defaults from the parent and merge them", function(){
      assert.deepEqual(B.schema.schema, {a: "a", b: "b"});
    });
    
  });

  describe("Operations", function(){

    var A = helper.models.Normal;

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

      describe("find", function(){
        var promise, as;

        before(function(done){
          promise = A.find({}, function(error, docs){
            as = docs;
            done();
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, monk.Promise);
        });
        it("should be an array", function(){
          assert.instanceOf(as, Array)
        });
        it("should be an array of instance of the Model", function(){
          as.forEach(function(a){
            assert.instanceOf(a, A);
          });
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

      describe("remove", function(){
        var promise, a2, count;

        before(function(done){
          promise = A.remove({_id: a._id}, function(error, c){
            count = c;
            A.findById(a._id, function(error, doc){
              a2 = doc
              done();
            });
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, monk.Promise);
        });
        it("should have removed one record", function(){
          assert.equal(count, 1);
        });
        it("should not return a record", function(){
          assert.isNull(a2);
        });
      });
    });
  });
  
  describe("indexes", function(){

    describe("indexing", function(){
      var M = new Model("models", helper.schemas.full)
        , promise
        , indexes;

      before(function(done){
        promise = M.index("a", function(error){
          if (error)
            return done(error);
          M.indexes(function(error, i){
            indexes = i;
            done(error);
          });
        });
      });

      it("should return a promise", function(){
        assert.instanceOf(promise, monk.Promise);
      });
      it("should have a the index setup", function(){
        assert.isDefined(indexes.a_1);
      });
    });
  });
});