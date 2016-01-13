var bcrypt = require('bcrypt-nodejs')
  , Item = require('./item')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , crypto = require('crypto')
  , uuid = require('node-uuid').v4;

module.exports = UserCollection;

function UserCollection () {

}

UserCollection.prototype.register = function (data) {
  return createUser.call(this, data);
};

UserCollection.prototype.updateUserPassword = function (userId, newPassword) {
  var self = this;
  newPassword = newPassword || uuid().replace(/-/g, '');

  return hashPassword(newPassword)
  .then(function (hashed) {
    return self.get(userId)
    .then(function (user) {
      user.hashedPassword = hashed;
      return self.put(user);
    });
  });
};

UserCollection.prototype.authenticate = function (data, service) {
  service = service || 'password';

  switch (service) {
    case 'password':
      return authenticatePassword.call(this, data);
    case 'facebook':
      return authenticateFacebook.call(this, data);
    case 'twitter':
      return authenticateTwitter.call(this, data);
    default:
      throw new Error('Must authenticate with Facebook, Twitter, or email');
  }
};

UserCollection.prototype.findByUsername = function (username, opts) {
  return this.view('byUsername', {key: username}, opts || {})
  .then(function (results) {
    if (results.length === 0) {
      return false;
    }

    if (results.keys) {
      return results;
    }

    return results[0];
  });
};

UserCollection.prototype.findByEmail = function (email, opts) {
  var params = {
    key: email
  };

  if (_.isArray(email)) {
    params = {
      keys: _.invoke(email, 'toString'),
      include_docs: (opts && opts.include_docs)
    };
  }

  return this.view('byEmail', params, opts || {})
  .then(function (results) {
    if (results.length === 0) {
      return false;
    }

    if (params.keys) {
      return results;
    }

    return results[0];
  });
};

UserCollection.prototype.findByTwitterId = function (id, opts) {
  // We use toString() because FB and Twitter ID's are numeric
  var params = {
    key: id.toString()
  };

  if (_.isArray(id)) {
    params = {
      keys: _.invoke(id, 'toString'),
      include_docs: (opts && opts.include_docs)
    };
  }

  return this.view('byTwitterId', params, opts || {})
  .then(function (results) {
    if (results.length === 0) {
      return false;
    }

    if (params.keys) {
      return results;
    }

    return results[0];
  });
};

UserCollection.prototype.findByFacebookId = function (id, opts) {
  var params = {
    key: id.toString()
  };

  if (_.isArray(id)) {
    params = {
      keys: _.invoke(id, 'toString'),
      include_docs: !!(opts && opts.include_docs)
    };
  }

  return this.view('byFacebookId', params, opts || {})
  .then(function (results) {
    if (results.length === 0) {
      return false;
    }

    if (params.keys) {
      return results;
    }

    return results[0];
  });
};

UserCollection.prototype.validate = function (user) {
  var services = ['password', 'facebook', 'twitter']
    , identifiers = ['email', 'facebookId', 'twitterId', 'username']
    , userIdentifiers = [];

  user.service = (user.service || 'password').toLowerCase();

  if (!user.username) {
    throw new Error('Username is required.');
  }

  if (!user.password && !user.hashedPassword) {
    throw new Error('Password is required.');
  }

  if (!user.email) {
    throw new Error('Email is required.');
  }

  if (!user.authOnly && !user.firstName) {
    throw new Error('First Name is required.');
  }

  if (!user.authOnly && !user.lastName) {
    throw new Error('Last Name is required.');
  }

  if (services.indexOf(user.service) < 0) {
    throw new Error('`user.service` must be one of: "' + services.join('", "') + '"');
  }

  if (user.facebookId) {
    user.facebookId = user.facebookId.toString();
  }

  if (user.twitterId) {
    user.twitterId = user.twitterId.toString();
  }

  identifiers.forEach(function (i) {
    if (user[i]) {
      userIdentifiers.push(i + ':' + user[i]);
    }
  });

  return this.view('identifiers', {keys: userIdentifiers}, {raw: true})
  .then(function (results) {
    var conflictingKey, conflictingUserId;

    if (results[0].rows.length !== 0) {
      conflictingKey = _.pluck(results[0].rows, 'key')[0].split(':');
      conflictingUserId = _.pluck(results[0].rows, 'value')[0];
      throw new Error('Could not save user. Key `' + conflictingKey[0] + '` conflicts with user `' + conflictingUserId + '` (value: "' + conflictingKey[1] + '").');
    }

    return true;
  });
};

UserCollection.fields = {
  service: 'hidden',
  email: 'email',
  username: 'string',
  firstName: 'string',
  lastName: 'string',
  password: 'password',
  phone: 'phone',
  facebookId: 'hidden',
  twitterId: 'hidden',
  facebookToken: 'hidden'
};

UserCollection.prototype.fake = function (Faker) {
  var first = Faker.name.firstName()
    , last = Faker.name.lastName();

  return {
    service: 'password',
    email: first + '.' + last + '@' + Faker.internet.domainName(),
    username: 'user_' + first + '.' + last + '@' + Faker.internet.domainName(),
    firstName: first,
    lastName: last,
    password: 'summit',
    phone: Faker.phone.phoneNumber()
  };
}

UserCollection.design = {};

UserCollection.design.views = {
  byUsername: {
    map: function (doc) {
      if (doc.type === '{{name}}' ) {
        emit(doc.username, doc);
      }
    }
  },

  byTwitterId: {
    map: function (doc) {
      if (doc.type === '{{name}}' && doc.twitterId) {
        emit(doc.twitterId, doc);
      }
    }
  },

  byFacebookId: {
    map: function (doc) {
      if (doc.type === '{{name}}' && doc.facebookId) {
        emit(doc.facebookId, doc);
      }
    }
  },

  byEmail: {
    map: function (doc) {
      if (doc.type === '{{name}}' && doc.email) {
        emit(doc.email, doc);
      }
    }
  },

  identifiers: {
    map: function (doc) {
      var identifiers = ['email', 'facebookId', 'twitterId', 'username'];

      if (doc.type === '{{name}}') {
        identifiers.forEach(function (i) {
          if (doc[i]) {
            emit(i + ':' + doc[i], doc._id);
          }
        });
      }
    }
  }
};

function createUser (data) {
  var self = this;
  var user;

  return this.validate(data)
  .then(function (valid) {

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
  })
  .then(function (results) {
    return user.raw();
  });
}

function authenticatePassword (data) {
  if (!data.username) {
    throw new Error('`username` is required for password authenticate');
  }

  if (!data.password) {
    throw new Error('`password` is required for password authenticate');
  }

  var username = data.username
    , password = data.password
    , testHash = '$2a$12$V4WlGwnYJfVNwWhaGdpg2eA8DdnyTdI/v6deXDhc4/pefgT8Os0hy';

  return this.findByUsername(username)
  .then(function (user) {
    user = user[0] || user;
    if (!user) {
      // Run the hash anyways
      // to thwart timing attacks
      return comparePasswords(password, testHash)
      .then(function () {
        return false;
      });
    }

    return comparePasswords(password, user.hashedPassword)
    .then(function (results) {
      if (results) {
        return user;
      }
      else {
        return false;
      }
    });
  });
}

function authenticateFacebook (data) {
  var self = this;

  if (!data.token) {
    throw new Error('`token` is required for Facebook authentication.');
  }

  if (data.unsafe) {
    return unsafeFacebookLogin.call(this, data);
  }

  return this.app.invoke.call(this.app, function (FB) {
    return FB.verifyToken(data.token)
    .then(function (result) {
      if (result.valid) {
        return self.findByFacebookId(result.facebookId);
      }
      else {
        return false;
      }
    });
  });
}

function authenticateTwitter (data) {
  var self = this;

  if (!data.token) {
    throw new Error('`token` is required for Facebook authentication.');
  }

  if (data.unsafe) {
    return unsafeTwitterLogin.call(this, data);
  }

  return this.app.invoke.call(this.app, function (Twitter) {
    return Twitter.verifyToken(data.token)
    .then(function (result) {
      if (result.valid) {
        return self.findByTwitterId(result.twitterId);
      }
      else {
        return false;
      }
    });
  });
}

function unsafeTwitterLogin (data) {
  var secret = this.app.env.unsafeLoginSecret
    , token = data.token
    , twitterId = data.twitterId;

  var goodToken = simpleHash(twitterId + secret);

  if (token === goodToken) {
    return this.findByTwitterId(twitterId);
  }
  else {
    return false;
  }
}

function unsafeFacebookLogin (data) {
  var secret = this.app.env.unsafeLoginSecret
    , token = data.token
    , facebookId = data.facebookId;

  var goodToken = simpleHash(facebookId + secret);

  if (token === goodToken) {
    return this.findByFacebookId(facebookId);
  }
  else {
    return false;
  }
}

function hashPassword (password) {
  return new Promise(function (resolve, reject) {
    bcrypt.hash(password, bcrypt.genSaltSync(), null, function(err, hash) {
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
        resolve(false);
      }
      else {
        resolve(true);
      }
    });
  });
}

function simpleHash (str) {
  var hash = crypto.createHash('sha256');
  hash.update(str);

  return hash.digest('utf8');
}