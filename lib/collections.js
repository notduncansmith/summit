var Collection = require('./collection');

module.exports = function (database) {
  var db = database.use('collections');
  return {
    get: function (name) {
      return new Collection(db.get(name));
    },
    put: function (name, coll) {
      return db.put(name, coll);
    }
  };
}