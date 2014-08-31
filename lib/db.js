var nano = require('nano')
  , q = require('bogart-edge').q;

function Database (config) {
  this.db = nano('http://' + config.db.host + ':' + config.db.port + '/' + config.db.name);
}

Database.prototype.get = function() {
  this.db.get.apply(arguments, function (err, body) {
    var def = q.defer();

    if (err) {
      def.reject(err);
    }
    else {
      def.resolve(body);
    }

    return def.promise;
  });
};

Database.prototype.put = function() {
  this.db.insert.apply(arguments, function (err, body) {
    var def = q.defer();

    if (err) {
      def.reject(err);
    }
    else {
      def.resolve(body);
    }

    return def.promise;
  });
};

module.exports = Database;