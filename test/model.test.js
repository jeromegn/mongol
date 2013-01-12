var helper  = require("./helper")
  , assert  = helper.assert
  , Model   = helper.Model
  , Promise = require("rsvp").Promise
  , mongo   = require("mongoskin");


describe("Model", function(){

  before(helper.clearDatabase);

  var M = new Model("models");

  it("should be a constructor", function(){
    assert.typeOf(M, "function");
  });
  it("should have a reference to the mongodb collection", function(){
    assert.instanceOf(M.collection, mongo.SkinCollection);
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
      assert.deepEqual(B.schema.schema, {a: "a", b: "b", _id: Model.ObjectID});
    });
    
  });

  describe("Operations", function(){

    var A = helper.models.Normal;

    describe("insert", function(){
      var promise, a, a2;

      before(function(done){
        promise = A.insert({str: "is a string", not_def: true}, function(error, doc){
          a = doc;
          done();
        }).then(function(doc){
          a2 = doc;
        });
      });

      it("should return a promise", function(){
        assert.instanceOf(promise, Promise);
      });
      it("should be an instance of the model", function(){
        assert.instanceOf(a, A);
        assert.instanceOf(a2, A);
      });

      it("should have an ID", function(){
        assert.isDefined(a._id);
        assert.isDefined(a2._id);
      });
      it("should have the defaults applied", function(){
        assert.equal(a.def, true);
        assert.equal(a2.def, true);
      });
      it("should have its properties applied", function(){
        assert.equal(a.str, "is a string");
        assert.equal(a2.str, "is a string");
      });
      it("should not override the property if set, even with a default", function(){
        assert.equal(a.not_def, true);
        assert.equal(a2.not_def, true);
      });

    });

    describe("querying", function(){
      var a;

      before(function(done){
        A.insert({str: "it's another string!", count: "1"}, function(error, doc){
          a = doc;
          done(error);
        }).then(function(doc){
        });
      });

      describe("find", function(){
        var promise, as, as2;

        before(function(done){
          promise = A.find({}, function(error, docs){
            as = docs;
            done(error);
          }).then(function(docs){
            as2 = docs;
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, Promise);
        });
        it("should be an array", function(){
          assert.instanceOf(as, Array);
          assert.instanceOf(as2, Array);
        });
        it("should be an array of instance of the Model", function(){
          as.forEach(function(a){
            assert.instanceOf(a, A);
          });
          as2.forEach(function(a){
            assert.instanceOf(a, A);
          });
        });
      });

      describe("find one", function(){
        var promise, a2, a3;

        before(function(done){
          promise = A.findOne({str: a.str}, function(error, doc){
            a2 = doc;
            done(error);
          }).then(function(doc){
            a3 = doc;
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, Promise);
        });
        it("should be an instance of the model", function(){
          assert.instanceOf(a2, A);
          assert.instanceOf(a3, A);
        });
        it("should cast the values in the correct type", function(){
          assert.strictEqual(a2.count, 1);
          assert.strictEqual(a3.count, 1);
        });

      });

      describe("find by Id", function(){
        var promise, a2, a3;

        before(function(done){
          promise = A.findById(a._id, function(error, doc){
            a2 = doc;
            done(error);
          }).then(function(doc){
            a3 = doc;
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, Promise);
        });
        it("should be an instance of the model", function(){
          assert.instanceOf(a2, A);
          assert.instanceOf(a3, A);
        });

      });

      describe("find and modify", function(){
        var promise, a2, a3;

        before(function(done){
          promise = A.findAndModify({_id: a._id}, [], {$set: {new_val: "it's new!"}}, {new: true}, function(error, doc){
            a2 = doc;
            done(error);
          }).then(function(doc){
            a3 = doc;
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, Promise);
        });
        it("should be an instance of the model", function(){
          assert.instanceOf(a2, A);
          assert.instanceOf(a3, A);
        });
        it("should have the new data", function(){
          assert.equal(a2.new_val, "it's new!");
          assert.equal(a3.new_val, "it's new!");
        });
      });
      
      describe("update", function(){
        var promise, count, count2;

        before(function(done){
          promise = A.update({_id: a._id}, {$set: {test: "it's new!"}}, function(error, updated){
            count = updated;
            done(error);
          }).then(function(updated){
            count2 = updated;
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, Promise);
        });
        it("should have updated one document", function(){
          assert.equal(count, 1);
          assert.equal(count2, 1);
        });
      });

      describe("remove", function(){
        var promise, a2, count, count2;

        before(function(done){
          promise = A.remove({_id: a._id}, function(error, removed){
            count = removed;
            if (error) done(error);
            A.findById(a._id, function(error, doc){
              a2 = doc
              done(error);
            });
          }).then(function(removed){
            count2 = removed;
          });
        });

        it("should return a promise", function(){
          assert.instanceOf(promise, Promise);
        });
        it("should return a count of the removed documents", function(){
          assert.equal(count, 1);
          assert.equal(count2, 1);
        });
        it("should have removed the document", function(){
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
        promise = M.ensureIndex("a", function(error){
          if (error)
            return done(error);
          M.indexInformation(function(error, i){
            indexes = i;
            done(error);
          });
        });
      });
      it("should have a the index setup", function(){
        assert.isDefined(indexes.a_1);
      });
    });
  });
});