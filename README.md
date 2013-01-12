# Mongol

Light modeling for MongoDB.

You're probably face palming yourself, wondering "why... oh why another mongodb model library?". Read on.

## Goals

- Simple and flexible modeling;
- Light codebase (just enough LOC, comprehensible, etc.);
- No schema lock-in (they're just there to ensure the right type of data gets written, if its there);
- Prototypal inheritance.

## Install

`npm install mongol`

## `Model`

### Initialize

Create a connection to the database and get the Model constructor by requiring `mongol`.

```javascript
var Mongol = require("mongol")("localhost/db_name");
  , Model = Mongol.Model;
```

By default, the connection has the `safe` MongoDB option set to `true`.

### Defining a `Model`

```javascript
var User = new Model("users");
```

Your `Model` works like a normal JavaScript object instance: prototypal inheritance.

```
User.prototype.firstName = function(){
  return this.name.split(" ")[0];
}
```

### Schema

You may pass a schema as second argument when constructing a `new Model`. This will cast the provided data in the right type when saving to MongoDB.

```javacript
var User = new Model("users", {
    email: String
  , name: String
  , password_hash: String

  , created_at: { type: Date, default: Date.now }
});
```

*Note: As opposed to mongoose, schemas are not enforced. With an instance, you may add or remove any field present or not in the schema. Schemas' only uses is typecasting.*

#### Embedded documents

You may define embedded documents' schema just like you'd define a `Model`'s schema.

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

### Inheritance

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

*Note: Hooks are not inherited.*

### Inserting

```javascript
User.insert({

    email: "john@doe.com"
  , name: "John Doe"
  , password: "password123" // Just use `bcrypt`, example below...

}, function(error, user) {
  // user instanceof User => true
  console.log(user.firstName()); // => "John"
});
```

### Finding, updating, removing, indexing, etc.

`find`, `findOne`, `findById`, `update`, `findAndModify`, `remove`, `index`, `indexes`, `dropIndex` and `dropIndexes` are all inherited from [mongoskin](https://github.com/kissjs/node-mongoskin) and they all send back an instance of your `Model` if possible.

## Instances of your models

`var user = new User()`

### save(callback)

Inserts or updates your instance (based on the presence or not of the key `_id`).

```javascript
user.save(function(error){
  // user inserted in the database
  // typeof user._id !== "undefined"

  user.newProperty = "this is a new property";
  user.save(function(error){
    // user has been updated
  });
});
```

### update(query, callback)

Updates your instance with the supplied `query`. It uses the collection's `update` method so **don't forget to use `$set`!**

It will not update your instance in memory, only in the database.

```javascript
user.update({$set: {newField: "test"}}, function(error, updated){
  // updated === true
  // user.newField === undefined
});
```

### reload(callback)

Reloads the current instance from the database.

```javascript
user.reload(function(error){
  // user.newField === "test"
});
```

### remove(callback)

Removes your instance from the database. Note that your instance of `User` is still filled with data, it just has its `_id` removed. Therefore you could reinsert it by using `save`.

```javascript
user.remove(function(error){
  // typeof user._id === "undefined"
});
```

## Hooks

A hook is a mechanism to perform some actions or alter some data before or after some event. Hooks are all asynchronous and therefore must call the provided callback. Available hooks are: "load", "insert", "update" and "remove".

Actually **useful** example of a parallel hook:

```javascript
User.before("insert", function(next, done){
  next(); // calls the next function in the hook's queue immediatly
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

### Sync

Hooks can be sync (and will run one after the other).

```javascript
User.before("insert", function(){
  this.prop = "some property value";
});
```

Example with an error:

```javascript
User.before("remove", function isNotAnAdmin(){
  return this.isAdmin !== true;
});
```

### Async

Hooks can be async and will still run one after the other. Use a callback in your function like so:

```javascript
User.after("remove", function(done){
  Post.remove({author: this._id}, done);
});
```

### Async and parallel

Hooks can be called in parallel. **You need to use two callback for those to work!**

```javascript
User.before("insert", function(next, done){
  // Call `next` whenever you want the next hook to start working
  next(); // the next hook will start doing its thing right away.
  somethingAsync(done);
});
```

### Available hooks (before and after)

- "load": the schema is applied (with `new User()`);
- "insert": the instance is inserted in the database;
- "remove": the instance is removed from the database;

## Validation

See "hooks".

`mongol` provides the basic structures for the most flexibility. Hooks are all you need for validation.

```javascript
var requireName = function(){
  if (typeof this.name === "undefined")
    throw new Error("Name is required");
}

User.before("insert", requireName);

User.before("insert", function(next){
  checkSomethingAsync(this, function(error, result){
    if (error)
      return next(new Error("Something when wrong when checking something async"));
    else if (!result)
      return next(new Error("No result when checking something async"));
    else {
      this.checkedAsynchronously = true;
      next();
    }
  });
});
```

Returning `false` in a sync hook will halt the hook's queue. It will then call your callback with an error;

If an error is thrown within a sync hook, it will halt the chain of hooks and your callback will be called with it as a first argument.

If an error is passed as first argument to a callback of an async hook, same thing will happen.

```javascript
User.insert({}, function(error, user){
  // error.message === "Name is required";
});
```

## Promises

All constructor and instance methods are available as promises (`then`able) through [RSVP.js](https://github.com/tildeio/rsvp), with the exception of indexing methods.

```javascript
User.insert({}).then(function(doc){
  // Do something with `doc`
}, function(error){
  // There was an error. Handle it already!
});
```

## Contributing

- Find a relevant feature to add/remove/change or find a bug to fix (protip: look at the issues);
- Code (while following the project's coding style);
- Write tests;
- Send a **self-contained** pull request.

## License

Licensed under MIT license

Copyright (c) 2012 Jerome Gravel-Niquet

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.