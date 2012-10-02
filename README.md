# Monastery

Light modeling for MongoDB (using [monk](http://github.com/learnboost/monk)).

## Goal

Provide basic modeling functionalities for mongodb while keeping the power of raw access to it.

## Install

`npm install monastery`

## Usage

### Defining a Model

```javascript
var Model = require("monastery")("localhost/db_name");

var User = new Model("users", {
    email: String
  , name: String
  , password_hash: String

  , created_at: { type: Date, default: Date.now }
});

User.prototype.firstName = function(){
  return this.name.split(" ")[0];
}
```

### Creating an instance

```javascript
User.create({

    email: john@doe.com
  , name: "John Doe"
  , password_hash: "123rjsahds" // Just use `bcrypt` though...

}, function(error, user) {
  // `user` is an instanceof User
  console.log(user.firstName()); // => "John"
});
```

### Finding, updating, removing, etc.

`find`, `findOne`, `findById`, `update`, `findAndModify`, `remove` are all inherited from [monk](http://github.com/learnboost/monk) and they all send back an instance of your `Model`.

Furthermore, they also all return a `promise`, just like monk.

### Hooks

A hook is a mechanism to perform some actions or alter some data before or after some event. Hooks are all asynchronous and therefore must call the provided callback. Available hooks are: "load", "insert", "update" and "remove".

```javascript
User.before("insert", function(done){
  this.changeThis = "to this";
  done();
});

User.after("remove", function(done){
  deleteSomeOtherRecordOrSomething(done);
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

#### Remove

Refers to the moment when a record is removed.

`before`: your instance is about to be removed from the database.  
`after`: your instance has been removed.

## Contributing

- Follow the coding style;
- Write a test;
- Send a **contained** pull request;

## License

TODO: Get license (MIT) from somewhere.