var _ = require('lodash')
  , makeForm = require('./forms.js')
  , inflection = require('inflection')
  , Promise = require('bluebird')
  , Item = require('./item');

module.exports = Collection;

function Collection (collection, db) {
  this.db = db;
  this.collection = collection;
}

Collection.prototype.get = function (id, opts) {
  return this.db.get(id)
  .then(function (results) {
    if (!opts || !opts.raw) {
      return results[0];
    }
    else {
      return results;
    }
  });
};

Collection.prototype.searchFor = function (terms) {
  // WARNING: This method not yet implemented in db.
  return this.db.search(this.collection.name, terms);
};

Collection.prototype.all = function (opts) {
  var name = 'cms-' + this.collection.name;
  return this.db.view(name, 'all').then(function (results) {
    if (!opts || !opts.raw) {
      return results[0].rows.map(function (i) { 
        return i.value;
      });
    }
    else {
      return results;
    }
  });
};

Collection.prototype.pages = function (opts) {
  
};

Collection.prototype.put = function (obj) {
  var item = new Item(obj, this);
  return item.save(); 
};

Collection.prototype.form = function () {
  return makeForm(this.collection);
};

Collection.prototype.setup = function () {
  var name = inflection.dasherize(this.collection.name);

  var newDoc = {
    _id: "_design/cms-" + name,
    views: {
      all: {
        map: "function (doc) { if (doc.collection == '" + name + "') { emit(doc.id, doc); } }"
      }
    }
  };

  var db = this.db;

  return db.get('_design/cms-' + name)
  .then(function (doc) {
    return Promise.resolve(doc);
  })
  .catch(function (err) {
    var doc = JSON.stringify(newDoc);
    return db.put('_design/cms-' + name, newDoc);
  });
}