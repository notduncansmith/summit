var nano = require('nano')
  , Promise = require('bluebird')
  , _ = require('lodash');

function Database (config) {
  this.connString = 'http://' + config.host + ':' + config.port;
  this.config = config;
  this.db = Promise.promisifyAll(nano(this.connString + '/' + config.name));
}

Database.prototype.get = function(name) {
  return this.db.getAsync(name);
};

Database.prototype.put = function(name, doc, force) {
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

Database.prototype.view = function(designDocName, viewName, params) {
  if (params) {
    return this.db.viewAsync(designDocName, viewName, params);
  }
  else {
    return this.db.viewAsync(designDocName, viewName);
  }
};

Database.prototype.search = function(designDocName, terms) {
  throw new Error('This method is yet to be implemented!');
};

module.exports = Database;