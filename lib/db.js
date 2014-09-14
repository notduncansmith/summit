var nano = require('nano')
  , Promise = require('bluebird')
  , _ = require('lodash');

function Database (config) {
  this.connString = 'http://' + config.host + ':' + config.port;
  this.config = config;
  this.db = nano(this.connString + '/' + config.name);
}

Database.prototype.get = function(name) {
  return defer(this.db, 'get', [name]);
};

Database.prototype.put = function(name, doc, force) {
  var args = [];

  if (force && force === true) {
    // TODO: Get record then put    
  }

  if (typeof name === 'string') {
    args = [doc, name];
  }
  else {
    args = [name, name._id];
  }
  
  return defer(this.db, 'insert', args)
  .then(function (results) {
    return doc || name;
  });
};

Database.prototype.use = function (name) {
  var config = _.extend({}, this.config, {name: name});
  return new Database(config);
};

Database.prototype.view = function(designDocName, viewName) {
  return defer(this.db, 'view', [designDocName, viewName]);
};

Database.prototype.search = function(designDocName, terms) {
  throw new Error('This method is yet to be implemented!');
};

function defer (obj, method, args) {
  return new Promise(function (resolve, reject) {
    obj[method].apply(obj, args, function (err, body) {
      if (err) {
        reject(err);
      }
      else {
        resolve(body);
      }
    });
  });
}

module.exports = Database;