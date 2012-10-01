# Monastery

Lightweight, barebone ODM for MongoDB using [monk](http://github.com/learnboost/monk).

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
```

## Contributing

TODO: Write this section.

## License

TODO: Get license (MIT) from somewhere.