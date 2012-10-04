# Monastery

Light modeling for MongoDB (using [monk](http://github.com/learnboost/monk)).

You're probably face palming yourself, wondering "why... oh why another mongodb model library?". Read on.

## Goals

- Simple and flexible modeling;
- Light codebase (just enough LOC, comprehensible, etc.);
- No schema lock-in (they're just there to ensure the right type of data gets written).

## Install

`npm install monastery`

## Usage

### Defining a Model

It's very similar to how you'd define a schema with mongoose:

```javascript
var Model = require("monastery")("localhost/db_name");

var User = new Model("users", {
    email: String
  , name: String
  , password_hash: String

  , created_at: { type: Date, default: Date.now }
});
```

Except your Model works like a normal JavaScript object instance: prototypal inheritance.

```
User.prototype.firstName = function(){
  return this.name.split(" ")[0];
}
```

### Embedded

You may define embedded documents just like you'd define a Model or just like you'd define a field.

```javascript
var Post = new Model("posts", {
    title: String
  , slug: String

  , author: Model.ObjectID

  , comments: [{
        author: Model.ObjectID
      , content: String
      , created_at: { type: Date, default: Date.now }
    }]

  , likes: [Model.ObjectID] // Casts any value in there as a MongoDB ObjectID
})
```

The documents will be casted according to your schema.

### Model inheritance

If you need models that are extensions of a more general model, you can inherit from another `Model` by using `Model.prototype.inherits`:

```javascript
var Doc = new Model("docs", {
  comments: Array
  author: Model.ObjectId
});

var Article = new Model("docs", {
  _type: "article"
}).inherits(Doc);
```

### Creating (inserting) an instance

```javascript
User.insert({

    email: john@doe.com
  , name: "John Doe"
  , password: "password123" // Just use `bcrypt`, example below...

}, function(error, user) {
  // user instanceof User => true
  console.log(user.firstName()); // => "John"
});
```

### Finding, updating, removing, etc.

`find`, `findOne`, `findById`, `update`, `findAndModify`, `remove` are all inherited from [monk](http://github.com/learnboost/monk) and they all send back an instance of your `Model`.

Furthermore, they also all return a `promise`, just like monk.

### Hooks

A hook is a mechanism to perform some actions or alter some data before or after some event. Hooks are all asynchronous and therefore must call the provided callback. Available hooks are: "load", "insert", "update" and "remove".

Actually **useful** examples:

```javascript
User.before("insert", function(done){
  bcrypt.hash(this.password, 10, function(error, hash){
    if (error)
      return done(error);

    this.password_hash = hash;
    delete this.password; // You wouldn't want to store that!
    done();
  });
});
```

You should pass an error to the callback if there is one. The operations will be alted.

#### Sync

Hooks can be sync (and will run one after the other).

```javascript
User.before("insert", function(){
  this.prop = "some property value";
});
```

#### Async

Hooks can be async and will still run one after the other. Use a callback in your function like so:

```javascript
User.after("remove", function(done){
  Post.remove({author: this._id}, done);
});
```

#### Async and parallel

Hooks can be called in parallel. **You need to use two callback for those to work!**

```javascript
User.before("insert", function(next, done){
  // Call `next` whenever you want the next hook to start working
  next(); // the next hook will start doing its thing right away.
  somethingAsync(done);
});
```

#### Available hooks (before and after)

- "load": the schema is applied (like: `new User({})`);
- "insert": the instance is inserted in the database;
- "update": `update` or `findAndModify` is called on the collection;
- "remove": the instance is removed from the database;

### Validation

See "hooks".

`monastery` provides the basic structures for the most flexibility. Hooks are all you need for validation.

```javascript
var requireName = function(){
  return typeof this.name === "undefined"
}

User.before("insert", requireName);

User.before("insert", function(done){
  checkSomethingAsync(this, done);
});
```

Returning `false` will halt the hook queue. It will also halt the operation you were attempting to complete.

## Contributing

- Follow the coding style;
- Write tests;
- Send a **self-contained** pull request.

## License

TODO: Get license (MIT) from somewhere.