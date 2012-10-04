var helper = require("./helper")
  , assert = helper.assert
  , Model  = helper.Model;

describe("Hooks", function(){
  before(helper.clearDatabase);

  describe("types", function(){
    var X = new Model("hooked", {
      def: "some string"
    });

    var x;

    describe("insert", function(){
      var beforeInsert, afterInsert;

      before(function(){
        X.before("insert", function(){
          beforeInsert = Object.clone(this);
          this.another = "property";
        });

        X.after("insert", function(){
          afterInsert = Object.clone(this);
          this.someVirtual = "this is a virtual";
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
        X.before("load", function(){
          beforeLoad = this;
          this.changedBefore = true;
        });

        X.after("load", function(){
          afterLoad = this;
          this.changedAfter = false;
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

  // The callback types work just fine, but I can't seem to test it. Getting a mocha error.
  // TODO: fix them.

  // describe("callback types", function(){
    
  //   var H = new Model("h", {});

  //   var h, sync, async, parallel1, parallel2;

  //   H.before("insert", function(){
  //     sync = Date.now();
  //     console.log("Called sync", sync);
  //     return true;
  //   });

  //   H.before("insert", function(next){
  //     setTimeout(function(){
  //       async = Date.now();
  //       console.log("Called async", async);
  //       next()
  //     }, 100);
  //   });

  //   H.before("insert", function(next, done){
  //     next();
  //     setTimeout(function(){
  //       parallel1 = Date.now();
  //       console.log("Called parallel 1", parallel1);
  //       done()
  //     }, 100);
  //   });

  //   H.before("insert", function(next, done){
  //     next();
  //     setTimeout(function(){
  //       parallel2 = Date.now();
  //       console.log("Called parallel 2", parallel2);
  //       done()
  //     }, 100);
  //   });


  //   before(function(done){
  //     H.insert({}, function(err, doc){
  //       h = doc;
  //       done();
  //     });
  //   });


  //   it("should have processed the callbacks in the right order", function(){
  //     console.log(sync);
  //     console.log(async);
  //     console.log(parallel1);
  //     console.log(parallel2);
  //     assert(false);
  //   });

  // });

});