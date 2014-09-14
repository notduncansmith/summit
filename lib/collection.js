var _ = require('lodash')
  , makeForm = require('./forms.js')
  , inflection = require('inflection')
  , Promise = require('bluebird');

module.exports = Collection;

function Collection (collection, db) {
  this.db = db.use('items');
  this.collection = collection;
  this.setup = ensureDesignDocs.bind(this, db, collection);
}

Collection.prototype.get = function (id) {
  return this.db.get(id);
}

Collection.prototype.searchFor = function (terms) {
  
}

Collection.prototype.all = function () {
  return this.db.allDocs();
}

Collection.prototype.pages = function (page, opts) {

}

Collection.prototype.put = function (id, obj) {
  return this.db.put(id, obj);
}

Collection.prototype.form = function () {
  return makeForm(this.collection);
}

function ensureDesignDocs (db, collection) {
  var name = inflection.dasherize(collection.name);

  var newDoc = {
    _id: "_design/cms-Foo",
    views: {
      all: "function (doc) { if (doc.collection == 'Foo') { emit(doc.id, doc); } }"
    }
  };

  return db.get('_design/cms-' + name)
  .then(function (doc) {
    return Promise.resolve(doc);
  })
  .catch(function (err) {
    var doc = JSON.stringify(newDoc);
    return db.put('_design/cms-' + name, doc);
  });
}