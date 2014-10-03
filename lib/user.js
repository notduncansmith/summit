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
    if (user.length === 0) {
      return createUser.bind(self)(data)
      .then(function (results) {
        data._rev = results[0].rev;
        return data;
      });
    }
    else {
      return user;
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
};

UserCollection.prototype.findByUsername = function (username, opts) {
  return this.view('byUsername', {key: username}, opts || {});
};

UserCollection.prototype.findByTwitterId = function (id, opts) {
  // We use toString() because FB and Twitter ID's are numeric
  var params = {
    key: id.toString()
  }

  if (_.isArray(id)) {
    params = {
      keys: _.invoke(id, 'toString'),
      include_docs: (opts && opts.include_docs)
    }
  }

  return this.view('byTwitterId', params, opts || {});
};

UserCollection.prototype.findByFacebookId = function (id, opts) {
  var params = {
    key: id.toString()
  }

  if (_.isArray(id)) {
    params = {
      keys: _.invoke(id, 'toString'),
      include_docs: (opts && opts.include_docs)
    }
  }

  return this.view('byFacebookId', params, opts || {});
};

UserCollection.fields = {
  email: 'email',
  username: 'string',
  password: 'password',
  firstName: 'string',
  lastName: 'string',
  phone: 'phone'
};

UserCollection.design = {};

UserCollection.design.views = {
  byUsername: {
    map: function (doc) { 
      if (doc.collection == '{{name}}' ) { 
        emit(doc.username, doc); 
      }
    }
  },

  byTwitterId: {
    map: function (doc) {
      if (doc.collection == '{{name}}' && doc.twitterId) {
        emit(doc.twitterId, doc);
      }
    }
  },

  byFacebookId: {
    map: function (doc) { 
      if (doc.collection == '{{name}}' && doc.facebookId) { 
        emit(doc.facebookId, doc);
      }
    }
  }
};

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