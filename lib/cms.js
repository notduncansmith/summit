var Database = require('./db')
  , _ = require('lodash');

function Cms (config) {
  this.db = new Database(config);

  this.collections = {};
  this.collection = collection.bind(this);
}

function collection (c) {
  if (typeof c === 'string') {
    return this.collections[c];
  }

  return this.collections[c.name] = c;
}

module.exports = Cms;