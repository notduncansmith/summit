/*

  This module is a work in progress.

  In order to reap the immediate benefits of packaging
  PouchDB with Summit, we're simply setting up a local
  HTTP server and deferring to the Nano driver for
  requests by default.

  However, it is obviously faster to simply query the
  native PouchDB object itself, so we're in the
  process of replacing HTTP calls with local calls.

  Features of the Nano driver that the native Pouch
  database does not support out of the box:

  - Update
  - List
  - Show
  - Purge
  - Feed
  - Follow

  Operations that PouchDB supports but we haven't
  gotten around to wrapping yet:
  - Get Attachments
  - Put Attachments
  - Bulk docs
  - Create DB
  - Destroy DB

*/

var _ = require('lodash')
  , Promise = require('bluebird')
  , Pouch = require('../../db_server')
  , NanoDriver = require('./nano');

module.exports = function (app) {
  return new Database(app);
};

function Database (app) {
  this.config = app.config.db;
  this.pouch = app.invoke(Pouch);

  this.pouch.listen();
  this.nano = new NanoDriver(app.config);
}

Database.prototype.get = function (name) {
  if (_.isArray(name)) {
    return Promise.all(name.map(this.get.bind(this)));
  }

  return this.pouch.get(name._id || name);
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
        return self.put(name, doc, results[0]._rev);
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
    doc._id = name;
    args = [doc];
  }
  else {
    args = [name];
  }

  return this.pouch.put.apply(this.pouch, args);
};

Database.prototype.use = function (name) {
  var config = _.extend({}, this.config, {name: name});
  return new Database(config);
};

Database.prototype.view = function (designDocName, viewName, params) {
  var query = designDocName + '/' + viewName;

  return (function () {
    if (params) {
      return this.pouch.query(query, params);
    }
    else {
      return this.pouch.query(query);
    }
  }.bind(this))()
  .then(function (results) {
    // API compatibility w/Nano client
    return [results];
  });
};

Database.prototype.fetch = function (ids) {
  return this.pouch.fetch({keys: ids});
};

Database.prototype.update = function (designDocName, updateName, docId, params) {
  var args = [].slice.call(arguments, 0);
  return this.nano.update.apply(this.nano, args);
};

Database.prototype.attach = function (name, filePaths) {
  return this.nano.attach(name, filePaths);
};

Database.prototype.createDb = function (name) {
  return this.nano.createDb(name);
};

Database.prototype.destroyDb = function (name) {
  return this.nano.destroyDb(name);
};

Database.prototype.destroy = function (name, rev) {
  return this.pouch.remove(name, rev);
};

Database.prototype.remove = function (name, rev) {
  return this.pouch.remove(name, rev);
};

Database.prototype.delete = function (name, rev) {
  return this.pouch.remove(name, rev);
};

Database.prototype.purge = function (name) {
  return this.nano.purge(name);
};

Database.prototype.list = function () {
  var args = [].slice.call(arguments, 0);
  return this.nano.list.apply(this.nano, args);
};

Database.prototype.detach = function (docId, attId) {
  return this.nano.detach(docId, attId);
};

Database.prototype.getAttachment = function (docId, attId) {
  return this.nano.getAttachment(docId, attId);
};

Database.prototype.feed = function (opts) {
  return this.nano.feed(opts);
};

Database.prototype.follow = function (opts, handler, nofollow) {
  return this.nano.follow(opts);
};

Database.prototype.bulk = function (docs, params) {
  var args = [].slice.call(arguments, 0);
  return this.nano.bulk.apply(this.nano, args);
};