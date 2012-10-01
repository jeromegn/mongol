# Monastery

Light modeling for MongoDB (using [monk](http://github.com/learnboost/monk)).

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

### Finding, updating, etc.

`find`, `findOne`, `findById`, `update` and `findAndModify` are all inherited from [monk](http://github.com/learnboost/monk) and they all send back an instance of your `Model`.

Furthermore, they also all return a `promise`, just like monk.

## Contributing

- Follow the coding style;
- Write a test;
- Send a **contained** pull request;

## License

TODO: Get license (MIT) from somewhere.