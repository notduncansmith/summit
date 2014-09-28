var Database = require('./db')
  , Collection = require('./collection')
  , middleware = require('./middleware');

module.exports = Cms;

function Cms (config) {
  this.config = config;
  this.db = new Database(config.db);
  this.collections = {};
  
  this.middleware = middleware(this);
}

Cms.prototype.collection = function collection (c) {
  if (typeof c === 'string') {
    return this.collections[c];
  }

  var coll = new Collection(c, this.db);
  
  this.collections[c.name] = coll;

  return coll;
};