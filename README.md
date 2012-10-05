# Monastery

Light modeling for MongoDB (using [monk](http://github.com/learnboost/monk)).

You're probably face palming yourself, wondering "why... oh why another mongodb model library?". Read on.

## Goals

- Simple and flexible modeling;
- Light codebase (just enough LOC, comprehensible, etc.);
- No schema lock-in (they're just there to ensure the right type of data gets written).

## Install

`npm install monastery`

## `Model`

### Initialize

Create a connection to the database and get the Model constructor by requiring `monastery`.

```javascript
var Monastery = require("monastery")("localhost/db_name");
  , Model = Monastery.Model;
```

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

*Note: As opposed to mongoose, schemas are not enforced. With an instance, you may add or remove any field present or not in the schema. Schemas' only use is typecasting.*

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

### update(data, options, callback)

Updates your instance with the supplied `data`.

Will use `collection.update` unless `new: true` is passed in the options object, in this case, it will use findAndModify and will apply the result to the instance.

```javascript
user.update({newField: "test"}, {new: true}, function(error, updated_user){
  // updated_user === user
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

### Sync

Hooks can be sync (and will run one after the other).

```javascript
User.before("insert", function(){
  this.prop = "some property value";
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
- "update": `update` or `findAndModify` is called on the collection;
- "remove": the instance is removed from the database;

## Validation

See "hooks".

`monastery` provides the basic structures for the most flexibility. Hooks are all you need for validation.

```javascript
var requireName = function(){
  return typeof this.name !== "undefined"
}

User.before("insert", requireName);

User.before("insert", function(done){
  checkSomethingAsync(this, done);
});
```

Returning `false` will halt the hook queue. It will also halt the operation you were attempting to complete.

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