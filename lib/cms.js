var Database = require('./db')
  , _ = require('lodash')
  , Collection = require('./collection');

function Cms (config) {
  this.db = new Database(config);

  this.collections = {};
  this.collection = collection.bind(this);
}

function collection (c) {
  if (typeof c === 'string') {
    return this.collections[c];
  }

  var coll = new Collection(c, this.db);
  
  this.collections[c.name] = coll;

  return coll;
}

module.exports = Cms;