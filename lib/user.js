var Collection = require('./collection')
  , bcrypt = require('bcrypt')
  , Item = require('./item')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , crypto = require('crypto');

module.exports = UserCollection;

function UserCollection () {
  
}

UserCollection.prototype.register = function (data) {
  return createUser(data);
};

UserCollection.prototype.authenticate = function (data, service) {
  var service = service || 'email';

  switch ('service') {
    case 'email':
      return authenticateEmail.call(this, data);
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

    if (params.keys) {
      return results;
    }

    return results[0];
  });
};

UserCollection.prototype.findByEmail = function (email, opts) {
  return this.view('byEmail', {key: email}, opts || {})
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
  }

  if (_.isArray(id)) {
    params = {
      keys: _.invoke(id, 'toString'),
      include_docs: (opts && opts.include_docs)
    }
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
  }

  if (_.isArray(id)) {
    params = {
      keys: _.invoke(id, 'toString'),
      include_docs: !!(opts && opts.include_docs)
    }
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

UserCollection.fields = {
  service: 'hidden',
  email: 'email',
  username: 'string',
  password: 'password',
  firstName: 'string',
  lastName: 'string',
  phone: 'phone',
  facebookId: 'hidden',
  twitterId: 'hidden',
  facebookToken: 'hidden'
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
  },

  byEmail: {
    map: function (doc) {
      if (doc.collection == '{{name}}' && doc.email) {
        emit(doc.email, doc);
      }
    }
  }
};

function createUser (data) {
  var user
    , self = this;

  var services = ['password', 'facebook', 'twitter'];

  data.service = data.service || 'password';

  if (!data.username) {
    throw new Error('Username is required.');
  }

  if (!data.password && !data.hashedPassword) {
    throw new Error('Password is required.');
  }

  if (!data.email) {
    throw new Error('Email is required.');
  }

  if (data.facebookId) {
    data.facebookId = data.facebookId.toString()
  }

  if (data.twitterId) {
    data.twitterId = data.twitterId.toString()
  }

  if (services.indexOf(data.service) < 0) {
    throw new Error('`service` must be one of: ' + services.join(','));
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

function authenticateEmail (data) {
  if (!data.username) {
    throw new Error('`username` is required for password authenticate');
  }

  if (!data.password) {
    throw new Error('`password` is required for password authenticate');
  }

  var username = data.username
    , password = data.password;

  this.findByUsername(username)
  .then(function (user) {
    
    if (user.length === 0) {
      return false;
    }

    return comparePasswords(password, user[0].hashedPassword)
    .then(function (results) {
      if (results) {
        return user[0];
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
    })
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
    })
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