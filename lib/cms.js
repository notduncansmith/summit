var Database = require('./db')
  , _ = require('lodash')
  , Collections = require('./collections');

function Cms (config) {
  this.db = new Database(config);

  this.collections = Collections(this.db);
  this.collection = collection.bind(this);
}

function collection (c) {
  if (typeof c === 'string') {
    return this.collections.get(c);
  }

  return this.collections.put(c.name, c);
}

module.exports = Cms;