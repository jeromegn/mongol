# Monastery

Light modeling for MongoDB (using [monk](http://github.com/learnboost/monk)).

## Goal

Provide basic modeling functionalities for mongodb while keeping the power of raw access to it.

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

Except your Model works like it should: prototypal inheritance.

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

User.after("remove", function(done){
  Post.remove({author: this._id}, done);
});
```

You should pass an error to the callback if there is one. The operations will be alted.

#### load

Refers to the moment of instantiation of your object.

`before`: your schema is not applied yet, `this` refers to a raw object.  
`after`: your schema has been applied, `this` refers to your instance.

#### insert

Refers to the moment when a record is inserted.

`before`: your instance is about to be inserted into the database.  
`after`: your instance has been inserted.

#### update

Refers to the moment when a record is updated either via `update` or `findAndModify`.

`before`: your instance is about to be updated in the database.  
`after`: your instance has been updated.

#### remove

Refers to the moment when a record is removed.

`before`: your instance is about to be removed from the database.  
`after`: your instance has been removed.

## Contributing

- Follow the coding style;
- Write a test;
- Send a **contained** pull request;

## License

TODO: Get license (MIT) from somewhere.