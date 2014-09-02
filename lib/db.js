var nano = require('nano')
  , q = require('bogart-edge').q
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
  var def = q.defer();

  obj[method].apply(obj, args, function (err, body) {
    if (err) {
      def.reject(err);
    }
    else {
      def.resolve(body);
    }
  });

  return def.promise;
}

module.exports = Database;