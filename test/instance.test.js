var helper = require("./helper")
  , assert = helper.assert
  , Model  = helper.Model;

describe("Instance of a model", function(){
  before(helper.clearDatabase);

  var M = helper.models.Full;

  describe("instantiating", function(){
    var m = new M();

    it("should apply the schema to the instance", function(){
      assert.equal(m.a, "a");
      assert.equal(m.b, "b");
      assert.equal(m.c, "test");
      assert.instanceOf(m.d, Date);
      assert.isUndefined(m.e);
      assert.equal(m.obj.is, "not a sub schema");
      assert.equal(m.sub.is, "a sub schema");
      assert.isUndefined(m.some_id);

      assert.isUndefined(m.embedded);
      assert.isUndefined(m.embed_nums);
      assert.isUndefined(m.ids);
    });

    it("should be marked as new", function(){
      assert.isTrue(m.isNew);
    });

    describe("with embedded documents", function(){
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
        assert.equal(m.c, "test");
        assert.instanceOf(m.d, Date);
        assert.isUndefined(m.e);
        assert.equal(m.obj.is, "not a sub schema");
        assert.equal(m.sub.is, "a sub schema");

        assert.isArray(m.embedded);
          assert.equal(m.embedded[0].a, "test");
          assert.equal(m.embedded[0].b, "b");
          assert.equal(m.embedded[0].c, "test");
          assert.instanceOf(m.embedded[0].d, Date);
          assert.isUndefined(m.embedded[0].e);

          assert.equal(m.embedded[1].a, "a");
          assert.equal(m.embedded[1].b, "b");
          assert.equal(m.embedded[1].c, "test");
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

    describe("from a model with inheritance", function(){
      
      var Basic2    = helper.models.Basic2;
      var Inherited = helper.models.Inherited;
      var b = new Inherited();

      it("should have the defaults applied", function(){
        assert.deepEqual(b, {a: "a", b: "b"});
      });

      it("should inherit the parent constructor's prototype", function(){
        assert.equal(b.test, Basic2.prototype.test);
      });
      it("should retain its prototype", function(){
        assert.equal(b.test2, Inherited.prototype.test2);
      });

    });

    describe("from a model with a custom _id", function(){
      var CustomID = helper.models.CustomID;

      var c = new CustomID({
        _id: "this is a string with many more chars than what is normally allowed for an ObjectID"
      });

      before(function(done){
        c.save(function(error){
          console.log("SAVED");
          c.reload(done);
        });
      });

      it("should not cast the _id as an ObjectID", function(){
        assert.notInstanceOf(c._id, Model.ObjectID);
      });
    });
  });

  describe("operations", function(){
    
    var M = new Model("basic", helper.schemas.basic);

    describe("saved instance", function(){
      var m, m2;

      before(function(done){
        M.insert({}, function(error, doc){
          m = doc;
          done(error);
        }).then(function(doc){
          m2 = doc;
        });
      });

      it("should be an instance of the Model", function(){
        assert.instanceOf(m, M);
        assert.instanceOf(m2, M);
      });
      it("should have an _id", function(){
        assert.isDefined(m._id);
        assert.isDefined(m2._id);
      });

      describe("update", function(){
        var count, count2;

        before(function(done){
          m.update({$set: {new_field: "yay"}}, function(error, updated){
            if (error)
              return done(error);
            count = updated;
            m.reload(done);
          }).then(function(updated){
            count2 = updated;
          });
        });

        it("should return an instance of the model", function(){
          assert.instanceOf(m, M);
        });
        it("should return the count of updated documents", function(){
          assert.equal(count, 1);
          assert.equal(count2, 1);
        });
        it("should have the modified fields", function(){
          assert.equal(m.new_field, "yay");
        });
        
      });

      describe("save", function(){

        before(function(done){
          m.newProp = "yep, new prop";
          m.a = "yippy";
          m.save(function(error){
            m.reload(done);
          });
        });

        it("should have updated the instance", function(){
          assert.equal(m.newProp, "yep, new prop");
          assert.equal(m.a, "yippy");
        });
      });

      describe("remove", function(){
        var doc, beforeRemove, afterRemove;

        before(function(){
          M.before("remove", function(){
            beforeRemove = true;
          });
          M.after("remove", function(){
            afterRemove = true;
          });
        });

        before(function(done){
          m.remove(function(error, data){
            doc = data;
            done();
          });
        });

        it("should return an instance of the model", function(){
          assert.instanceOf(doc, M);
        });
        it("should have removed the _id from the instance", function(){
          assert.isUndefined(doc._id);
        });
        it("should have ran the 'before remove' hook", function(){
          assert.isTrue(beforeRemove);
        });
        it("should have ran the 'after remove' hook", function(){
          assert.isTrue(afterRemove);
        });
      });

    });

    describe("unsaved instance", function(){
      var m2 = new M();

      describe("save", function(){
        var beforeInsert, afterInsert;
        
        before(function(){
          M.before("insert", function(){
            beforeInsert = true;
          });
          M.after("insert", function(){
            afterInsert = true;
          });
        });

        before(function(done){
          m2.save(function(error){
            process.nextTick(function(){
              done(error)
            });
          });
        });

        it("should have inserted the instance", function(){
          assert.isDefined(m2._id);
        });
        it("should not be marked as new", function(){
          assert.isFalse(m2.isNew);
        });

        it("should have ran the 'before insert' hook", function(){
          assert.isTrue(beforeInsert);
        });
        it("should have ran the 'after insert' hook", function(){
          assert.isTrue(afterInsert);
        });
      });
    });
  });
  
  describe("partial instances", function(){
    var instance, partial;

    before(function(done){
      M.insert({}, function(error, doc){
        instance = doc;
        M.findById(instance._id, ["a"], function(error, doc){
          partial = doc;
          done(error);
        });
      });
    });

    it("should return an instance of the model", function(){
      assert.instanceOf(partial, M);
    });
    it("should only have the selected fields and the _id", function(){
      assert.deepEqual(partial, {a: "a", _id: instance._id})
    });

    describe("reload", function(){
      before(function(done){
        partial.reload(done)
      });

      it("should still be an instance of the model", function(){
        assert.instanceOf(partial, M);
      });
      it("should have the fields applied to it", function(){
        assert.isDefined(partial.b);
        assert.isDefined(partial.c);
        assert.isDefined(partial.d);
        assert.isDefined(partial.obj);
        assert.isDefined(partial.sub);
      });
    });
  });
});