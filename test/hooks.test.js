var helper = require("./helper")
  , assert = helper.assert
  , util   = require("../lib/mongol/util")
  , Model  = helper.Model;

describe("Hooks", function(){
  before(helper.clearDatabase);

  var X = new Model("hooked", {
    str: "some string"
  });

  describe("before", function(){

    var pending_insert = 0
      , pending_load = 0
      , pending_remove = 0;

    describe("load", function(){
      var x
        , before_sync
        , before_async
        , before_parallel;

      before(function(){
        X.before("load", function(){
          before_sync = this instanceof X;
          this.sync_load = new Date();
          pending_load--;
        });
        pending_load++;

        X.before("load", function(next){
          before_async = this instanceof X;
          setTimeout(function(){
            this.async1_load = new Date();
            pending_load--;
            next();
          }.bind(this), 100);
        });
        pending_load++;

        X.before("load", function(next){
          setTimeout(function(){
            this.async2_load = new Date();
            pending_load--;
            next();
          }.bind(this), 100);
        });
        pending_load++;

        X.before("load", function(next, done){
          before_parallel = this instanceof X;
          next();
          setTimeout(function(){
            this.parallel1_load = new Date();
            pending_load--;
            done();
          }.bind(this), 100);
        });
        pending_load++;

        X.before("load", function(next, done){
          next();
          setTimeout(function(){
            this.parallel2_load = new Date();
            pending_load--;
            done();
          }.bind(this), 50);
        })
        pending_load++;
      });

      before(function(done){
        X._load({}, function(error, obj){
          x = obj;
          done(error);
        });
      });

      it("should have ran all the hooks", function(){
        assert.equal(pending_load, 0);
      });
      it("should have assigned the properties before inserting", function(){
        assert.instanceOf(x.sync_load, Date);
        assert.instanceOf(x.async1_load, Date);
        assert.instanceOf(x.async2_load, Date);
        assert.instanceOf(x.parallel1_load, Date);
        assert.instanceOf(x.parallel2_load, Date);
      });
      it("should have ran the hooks in the right order", function(){
        assert(x.sync_load < x.async1_load);
        assert(x.async1_load < x.async2_load);
        assert(x.async2_load < x.parallel1_load);
        assert(x.parallel1_load > x.parallel2_load); // Parallel 1 was longer than parallel 2
      });
      it("should have scoped the hook with the raw obj", function(){
        assert.isFalse(before_sync);
        assert.isFalse(before_async);
        assert.isFalse(before_parallel);
      });
    });

    describe("insert", function(){
      var x
        , before_sync
        , before_async
        , before_parallel;

      before(function(){
        X.before("insert", function(){
          before_sync = this instanceof X;
          this.sync_insert = new Date();
          pending_insert--;
        });
        pending_insert++;

        X.before("insert", function(next){
          before_async = this instanceof X;
          setTimeout(function(){
            this.async1_insert = new Date();
            pending_insert--;
            next();
          }.bind(this), 100);
        });
        pending_insert++;

        X.before("insert", function(next){
          setTimeout(function(){
            this.async2_insert = new Date();
            pending_insert--;
            next();
          }.bind(this), 100);
        });
        pending_insert++;

        X.before("insert", function(next, done){
          before_parallel = this instanceof X;
          next();
          setTimeout(function(){
            this.parallel1_insert = new Date();
            pending_insert--;
            done();
          }.bind(this), 100);
        });
        pending_insert++;

        X.before("insert", function(next, done){
          next();
          setTimeout(function(){
            this.parallel2_insert = new Date();
            pending_insert--;
            done();
          }.bind(this), 50);
        })
        pending_insert++;
      });

      before(function(done){
        X.insert({}, function(error, doc){
          x = doc;
          done(error);
        })
      });

      it("should have ran all the hooks", function(){
        assert.equal(pending_insert, 0);
      });
      it("should have assigned the properties before inserting", function(){
        assert.instanceOf(x.sync_insert, Date);
        assert.instanceOf(x.async1_insert, Date);
        assert.instanceOf(x.async2_insert, Date);
        assert.instanceOf(x.parallel1_insert, Date);
        assert.instanceOf(x.parallel2_insert, Date);
      });
      it("should have ran the hooks in the right order", function(){
        assert(x.sync_insert < x.async1_insert);
        assert(x.async1_insert < x.async2_insert);
        assert(x.async2_insert < x.parallel1_insert);
        assert(x.parallel1_insert > x.parallel2_insert); // Parallel 1 was longer than parallel 2
      });
      it("should have scoped the hook with the an instance", function(){
        assert.isTrue(before_sync);
        assert.isTrue(before_async);
        assert.isTrue(before_parallel);
      });
    });

  });

  describe("after", function(){
    var pending_insert = 0;

    describe("insert", function(){
      var x
        , after_sync
        , after_async
        , after_parallel;

      before(function(){
        X.after("insert", function(){
          after_sync = this instanceof X;
          this.sync_after_insert = new Date();
          pending_insert--;
        });
        pending_insert++;

        X.after("insert", function(next){
          after_async = this instanceof X;
          setTimeout(function(){
            this.async1_after_insert = new Date();
            pending_insert--;
            next();
          }.bind(this), 100);
        });
        pending_insert++;

        X.after("insert", function(next){
          setTimeout(function(){
            this.async2_after_insert = new Date();
            pending_insert--;
            next();
          }.bind(this), 100);
        });
        pending_insert++;

        X.after("insert", function(next, done){
          after_parallel = this instanceof X;
          next();
          setTimeout(function(){
            this.parallel1_after_insert = new Date();
            pending_insert--;
            done();
          }.bind(this), 100);
        });
        pending_insert++;

        X.after("insert", function(next, done){
          next();
          setTimeout(function(){
            this.parallel2_after_insert = new Date();
            pending_insert--;
            done();
          }.bind(this), 50);
        })
        pending_insert++;
      });

      before(function(done){
        X.insert({}, function(error, doc){
          x = doc;
          setTimeout(function(){
            done(error);
          }, 500);
        })
      });

      it("should have ran all the hooks", function(){
        assert.equal(pending_insert, 0);
      });
      it("should have assigned the properties before inserting", function(){
        assert.instanceOf(x.sync_after_insert, Date);
        assert.instanceOf(x.async1_after_insert, Date);
        assert.instanceOf(x.async2_after_insert, Date);
        assert.instanceOf(x.parallel1_after_insert, Date);
        assert.instanceOf(x.parallel2_after_insert, Date);
      });
      it("should have ran the hooks in the right order", function(){
        assert(x.sync_after_insert < x.async1_after_insert);
        assert(x.async1_after_insert < x.async2_after_insert);
        assert(x.async2_after_insert < x.parallel1_after_insert);
        assert(x.parallel1_after_insert > x.parallel2_after_insert); // Parallel 1 was longer than parallel 2
      });
      it("should have scoped the hook with the an instance", function(){
        assert.isTrue(after_sync);
        assert.isTrue(after_async);
        assert.isTrue(after_parallel);
      });
    });
  });
});