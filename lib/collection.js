var _ = require('lodash')
  , makeForm = require('./forms.js')
  , inflection = require('inflection')
  , Promise = require('bluebird')
  , Item = require('./item')
  , util = require('./util')
  , UserCollection = require('./user')
  , UploadCollection = require('./upload');

module.exports = Collection;

function Collection (collection, db) {
  this.db = db;
  this.collection = collection;

  if (collection.isUserType) {
    _.extend(this, UserCollection.prototype);
  }

  if (collection.isUploadType) {
    _.extend(this, UploadCollection.prototype);
  }
}

Collection.prototype.get = function (id, opts) {
  return this.db.get(id)
  .then(function (results) {
    if ((!opts || !opts.raw) && (typeof id === 'string')) {
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
  return this.view('all', opts);
};

Collection.prototype.view = function (viewName, params, opts) {
  var name = 'cms-' + this.collection.name
    , params = params || {};
  
  return this.db.view(name, viewName, params)
  .then(function (results) {
    if (!opts || !opts.raw) {
      return results[0].rows.map(function (i) { 
        return i.value;
      });
    }
    else {
      return results;
    }
  });
}

Collection.prototype.pages = function (opts) {
  
};

Collection.prototype.put = function (obj) {
  var item = new Item(obj, this);
  return item.save();
};

Collection.prototype.form = function (opts) {
  return makeForm(this.collection, opts);
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

  if (this.collection.isUserType) {
    newDoc.views.byUsername = {
      map: "function (doc) { if (doc.collection == '" + name + "') { emit(doc.username, doc); } }"
    }
  }

  return util.ensureDesignDoc(this.db, name, newDoc);
};