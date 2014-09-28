var Collection = require('./collection')
  , bcrypt = require('bcrypt')
  , Item = require('./item')
  , _ = require('lodash')
  , Promise = require('bluebird');

module.exports = UserCollection;

function UserCollection () {
  
}


UserCollection.prototype.user = function(data) {
  var self = this
    , username = data;

  if (typeof data !== 'string') {
    username = data.username;
  }

  return this.findByUsername(username)
  .then(function (user) {
    return user;
  })
  .catch(function (err) {
    if (err.message === 'missing') {
      return createUser.bind(self)(data);
    }
    else {
      throw err;
    }
  });
};

UserCollection.prototype.authenticate = function (username, password) {
  return this.findByUsername(username)
  .then(function (user) {
    return comparePasswords(password, user.hashedPassword)
    .then(function () {
      return user;
    });
  }); // no need to catch, anyone consuming this method
      // will handle it since we reject on failure
}

UserCollection.prototype.findByUsername = function (username, opts) {
  return this.view('byUsername', {key: username}, opts || {});
}
}

function createUser (data) {
  var user
    , self = this;

  if (!data.email) {
    throw new Error('Email is required.');
  }

  if (!data.username) {
    throw new Error('Username is required.');
  }

  if (!data.password && !data.hashedPassword) {
    throw new Error('Password is required.');
  }

  if (data.password) {
    return hashPassword(data.password)
    .then(function (hashed) {
      user = new Item(data, self);
      delete user.password;
      user.hashedPassword = hashed;

      return user.save();
    });
  }
  else {
    user = new Item(data, self);
    return user.save();
  }
}

function hashPassword (password) {
  return new Promise(function (resolve, reject) {
    bcrypt.hash(password, 12, function(err, hash) {
      if (err) {
        return reject(err);
      }
      resolve(hash);
    });
  });
}

function comparePasswords (attempted, stored) {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(attempted, stored, function (err, res) {
      if (err) {
        reject(err);
      }
      else if (res === false) {
        reject('Passwords do not match');
      }
      else {
        resolve(true);
      }
    });
  });
}