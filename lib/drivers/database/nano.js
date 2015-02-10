var nano = require('nano')
  , Promise = require('bluebird')
  , _ = require('lodash')
  , fs = Promise.promisifyAll(require('fs'))
  , path = require('path')
  , util = require('../../util');

module.exports = function (config) {
  return new Database(config.db);
};

function Database (config) {
  var protocol = (config.https && config.https !== 'false') ? 'https' : 'http'
    , port = (config.port === '80' || config.port === 80) ? '' : (':' + config.port)
    , authString = config.auth ? (config.auth + '@') : '';

  this.config = config;
  this.connString = protocol + '://' + authString + config.host + port;

  console.log('Connecting to database (' + config.driver + '): ' + this.connString);

  this.db = Promise.promisifyAll(nano(this.connString + '/' + config.name));
  this.nano = Promise.promisifyAll(nano(this.connString).db);
  this.attachments = Promise.promisifyAll(this.db.attachment);
}

Database.prototype.get = function (name) {
  if (_.isArray(name)) {
    return Promise.all(name.map(this.get.bind(this)));
  }

  return this.db.getAsync(name._id || name);
};

Database.prototype.put = function (name, doc, force) {
  var args = []
    , self = this;

  if (force && force === true) {
    return this.get(name)
    .then(function (results) {
      if (results.length === 0) {
        return self.put(name, doc);
      }
      else {
        return self.purge(name)
        .then(function () {
          return self.put(name, doc);
        });
      }
    })
    .catch(function (err) {
      if (err.message === 'missing' || err.message === 'deleted') {
        return self.put(name, doc);
      }
      console.log('Error putting document: ', err);
    });
  }

  if (typeof name === 'string') {
    args = [doc, name];
  }
  else if (name._id) {
    args = [name, name._id];
  }
  else {
    args = [name];
  }

  return this.db.insertAsync.apply(this.db, args);
};

Database.prototype.use = function (name) {
  var config = _.extend({}, this.config, {name: name});
  return new Database(config);
};

Database.prototype.view = function (designDocName, viewName, params) {
  if (params) {
    return this.db.viewAsync(designDocName, viewName, params);
  }
  else {
    return this.db.viewAsync(designDocName, viewName);
  }
};

Database.prototype.fetch = function (ids) {
  return this.db.fetchAsync({keys: ids});
};

Database.prototype.update = function (designDocName, updateName, docId, params) {
  // nano.db.atomic is broken, so we have to create our own request
  // this will behave according to the nano docs (use req.form to get params)
  var opts = {
    db: this.config.name,
    path: '_design/' + designDocName + '/_update/' + updateName + '/' + docId,
    method: 'PUT',
    content_type: 'application/x-www-form-urlencoded',
    form: params
  };

  return this.relax(opts);
};

Database.prototype.relax = function (opts) {
  var defaults = {
    db: this.config.name
  };

  var opts = _.extend({}, defaults, opts);

  return Promise.promisifyAll(nano(this.connString)).relaxAsync(opts);
};

Database.prototype.attach = function (name, filePaths) {
  var self = this
    , doc = (typeof name === 'string' ? this.get(name) : Promise.resolve([name]));

  if (filePaths.length === 0) {
    return doc.get(0);
  }

  if (typeof filePaths === 'string') {
    filePaths = [filePaths];
  }

  return doc
  .get(0)
  .then(function (results) {
    doc = results;
    console.log('Attaching to: ', doc);
    return Promise.all(filePaths.map(util.getFile));
  })
  .then(function (files) {
    return new Promise(function (resolve, reject) {
      self.db.multipart.insert(doc, files, doc._id, function (err, body) {
        if (err) {
          reject(err);
        }
        else {
          _.extend(doc._attachments, body._attachments);
          resolve(doc);
        }
      });
    });
  });
};

Database.prototype.destroyDb = function (name) {
  if (_.isArray(name)) {
    return Promise.all(name.map(this.destroyDb.bind(this)));
  }
  return this.nano.destroyAsync(name);
};

Database.prototype.destroy = function (name) {
  var self = this;

  if (_.isArray(name)) {
    return Promise.all(name.map(this.destroy.bind(this)));
  }

  return this.get(name)
  .get(0)
  .get('_rev')
  .then(function (rev) {
    return self.db.destroyAsync(name, rev);
  });
};

Database.prototype.purge = function (name) {
  var conn = this.connString
    , self = this;

  var opts = {
    method: 'POST',
    path: '_purge',
    body: {}
  };

  if (conn.indexOf('.cloudant.com')) {
    // Cloudant doesn't support purge, so we'll just do a regular delete
    console.log('Warning, Cloudant doesn\'t support purge.');
    console.log('Doing a regular delete for now.');
    return this.destroy(name);
  }

  return this.get(name)
  .get(0)
  .get('_rev')
  .then(function (rev) {
    opts.body[name] = [rev];
    return self.relax(opts);
  });
};

Database.prototype.createDb = function (name) {
  var conn = this.connString;

  if (_.isArray(name)) {
    return Promise.all(name.map(this.createDb.bind(this)));
  }

  return new Promise(function (resolve, reject) {
    nano(conn).db.create(name, function (err, body) {
      if (err && err.error !== 'file_exists') {
        // If it already exists, we're good
        reject(err);
      }
      else {
        resolve(body);
      }
    });
  });
};

Database.prototype.list = function () {
  var conn = this.connString;

  return new Promise(function (resolve, reject) {
    nano(conn).db.list(function (err, body) {
      if (err) {
        reject(err);
      }
      else {
        resolve(body);
      }
    });
  });
};

Database.prototype.detach = function (docId, attId) {
  var self = this;

  return this.get(docId)
  .get(0)
  .then(function (doc) {
    return self.attachments.destroyAsync(docId, attId, doc._rev);
  });
};

Database.prototype.getAttachment = function (docId, attId) {
  var self = this;
  // Don't ask me why using this.attachments doesn't work.
  // It just doesn't.
  return new Promise(function (resolve, reject) {
    self.db.attachment.get(docId, attId, function (err, body) {
      if (err) {
        reject(err);
      }
      else {
        resolve(body);
      }
    });
  });
};

Database.prototype.feed = function (opts) {
  return this.db.follow(opts);
};

Database.prototype.follow = function (opts, handler, nofollow) {
  var feed = this.feed(opts);

  feed.on('changes', handler);

  if (!opts.noFollow && !nofollow) {
    feed.follow();
  }

  return feed;
};

Database.prototype.bulk = function (docs, params) {
  var bulkInput = (!docs.docs) ? {docs:docs} : docs;
  return this.db.bulkAsync(bulkInput, params);
};