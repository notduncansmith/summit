var nano = require('nano')
  , Promise = require('bluebird')
  , _ = require('lodash')
  , fs = Promise.promisifyAll(require('fs'))
  , path = require('path')
  , util = require('./util');

module.exports = Database;

function Database (config) {
  var protocol = (config.https && config.https !== "false") ? 'https' : 'http'
    , port = (config.port === "80" || config.port === 80) ? '' : ':' + config.port
    , authString = config.auth || '';

  this.config = config;
  this.connString = protocol + '://' + authString + config.host + port;

  console.log('Connecting to: ' + this.connString);
  this.db = Promise.promisifyAll(nano(this.connString + '/' + config.name));
}

Database.prototype.get = function (name) {
  if (_.isArray(name)) {
    return Promise.all(name.map(this.get));
  }

  return this.db.getAsync(name._id || name);
};

Database.prototype.put = function (name, doc, force) {
  var args = [];

  if (force && force === true) {
    // TODO: Get record then put    
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

Database.prototype.search = function (designDocName, terms) {
  throw new Error('This method is yet to be implemented!');
};

Database.prototype.attach = function (name, filePaths) {
  var self = this
    , doc = (typeof name === 'string' ? this.get(name) : Promise.resolve([name]));
  
  if (filePaths.length === 0) {
    return doc.get(0);
  }

  if (typeof filePaths === 'string') {
    filePaths = [filePaths]
  }

  return doc
  .get(0)
  .then(function (results) {
    doc = results;
    console.log('Attaching to: ', doc)
    return Promise.all(filePaths.map(getFile));
  })
  .then(function (files) {
    return new Promise(function (resolve, reject) {
      self.db.multipart.insert(doc, files, doc._id, function (err, body) {
        if (err) {
          reject(err);
        }
        else {
          _.extend(doc._attachments, body._attachments)
          resolve(doc);
        }
      });
    });
  });
};

Database.prototype.purge = function(name) {
  var conn = this.connString
    , self = this;

  var opts = {
    method: 'POST',
    path: '_purge',
    body: {}
  };

  return this.get(name)
  .get(0)
  .get('_rev')
  .then(function (rev) {
    opts.body[name] = [rev];
    return self.relax(opts);
  });
};

Database.prototype.create = function(name) {
  
  var conn = this.connString;
  return new Promise(function (resolve, reject) {
    nano(conn).db.create(name, function (err, body) {
      if (err) {
        reject(err);
      }
      else {
        resolve(body);
      }
    });
  });
};

Database.prototype.list = function() {
  var conn = this.connString;

  return new Promise(function (resolve, reject) {
    nano(conn).db.list(function (err, body) {
      if (err) {
        reject(err);
      }
      else {
        resolve(body);
      }
    })
  })
};

Database.prototype.detach = function(docId, attId) {
  var self = this;

  return this.get(docId)
  .get(0)
  .then(function (doc) {
    return new Promise(function (resolve, reject) {
      self.db.attachment.destroy(docId, attId, doc._rev, function (err, body) {
        if (err) {
          reject(err);
        }
        else {
          resolve(body);
        }
      })
    });
  })
};

Database.prototype.getAttachment = function (docId, attId) {
  var self = this;

  return new Promise(function (resolve, reject) {
    self.db.attachment.get(docId, attId, function (err, body) {
      console.log(body);
      if (err) {
        reject(err);
      }
      else {
        resolve(body);
      }
    });
  });
};

Database.prototype.getAttachmentStream = function (docId, attId) {
  return this.db.attachment.get(docId, attId);
};

function getFile (filePath) {
  return fs.readFileAsync(filePath)
  .then(function (data) {
    return {
      data: data,
      content_type: util.getContentType(filePath),
      name: path.basename(filePath)
    };
  });
}
