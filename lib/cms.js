var Database = require('./db')
  , Collection = require('./collection')
  , middleware = require('./middleware')
  , FB = require('./fb')
  , _ = require('lodash');

module.exports = Cms;

function Cms (config) {
  this.config = config;
  this.db = new Database(config.db);
  this.collections = {};
  
  this.middleware = middleware(this);
  this.fb = new FB(FB.appAccessToken(this.config.facebook));
}

Cms.prototype.setup = function () {
  var self = this;

  return _.keys(this.collections)
  .map(function (c) {
    return self.collections[c].setup();
  });
};

Cms.prototype.collection = function collection (c) {
  if (typeof c === 'string') {
    return this.collections[c];
  }

  var coll = new Collection(c, this.db);
  
  this.collections[c.name] = coll;

  return coll;
};