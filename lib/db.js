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
  if (force && force === true) {
    // TODO: Get record then put    
  }
  return defer(this.db, 'insert', [doc, name]);
};

Database.prototype.use = function (name) {
  var config = _.extend({}, this.config, {name: name});
  return new Database(config);
}

function defer (obj, method, args) {
  return new Promise(function (resolve, reject) {
    obj[method].apply(obj, args, function (err, body) {
      if (err) {
        def.reject(err);
      }
      else {
        def.resolve(body);
      }
    });
  });
}

module.exports = Database;