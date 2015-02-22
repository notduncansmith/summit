var _ = require('lodash')
  , makeForm = require('./collection/forms.js')
  , Promise = require('bluebird')
  , Item = require('./collection/item')
  , UserCollection = require('./collection/user')
  , GroupCollection = require('./collection/group')
  , routeHelpers = require('./collection/collection_routes')
  , helpers = require('./collection/collection_helpers')
  , EventEmitter = require('events').EventEmitter;

module.exports = Collection;

function Collection (collection, app) {
  this.router = app.router();

  this._ee = new EventEmitter();
  this.name = collection.name;
  this.app = app;
  this.db = app.db;
  this.collection = collection;
  this.mergeCollection(collection);
  this.dbSafeName = helpers.dbSafeName(this.collection.name);

  if (collection.restful) {
    routeHelpers.apiRoutes(this);
    routeHelpers.methodRoutes(this);
  }

  _.extend(this, this.methods);
}

Collection.prototype.fields = {};

Collection.prototype.design = {
  updates: {},
  lists: {},
  shows: {},
  views: {
    all: {
      map: function (doc) {
        if (doc.type === '{{name}}') {
          emit(doc._id, doc);
        }
      }
    }
  }
};

Collection.prototype.applyCollectionType = function (collectionType) {
  _.extend(this, collectionType.prototype);
  this.design = helpers.mergeDesignDocs(this.design, collectionType.design || {});
  this.fields = _.extend({}, this.fields, collectionType.fields);
};

Collection.prototype.mergeCollection = function (collection) {
  if (collection.isUserType) {
    this.applyCollectionType(UserCollection);
    this.isUserType = true;
  }

  if (collection.isGroupType) {
    this.applyCollectionType(GroupCollection);
    this.isGroupType = true;
  }

  this.design = helpers.mergeDesignDocs(this.design, collection.design || {});
  this.fields = _.extend({}, this.fields, collection.fields || {});
  this.methods = _.extend({}, this.methods, collection.methods || {});

  if (collection.timestamps !== false) {
    this.timestamps = true;
  }

  if (collection.setup) {
    this.setup = collection.setup;
  }
};

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

Collection.prototype.all = function (params) {
  return this.view('all', params);
};

Collection.prototype.update = function (updateName, docId, params) {
  this.emit('update:before', {updateName: updateName, docId: docId, params: params});

  var name = this.dbSafeName
    , params = params || {};

  return this.db.update(name, updateName, docId, params)
  .then(function (results) {
    this.emit('update', {updateName: updateName, docId: docId, params: params, results: results});
    this.emit('update:after', {updateName: updateName, docId: docId, params: params, results: results});
    return results;
  });
};

Collection.prototype.view = function (viewName, params, opts) {
  var name = this.dbSafeName
    , params = params || {}
    , opts = opts || {};

  // Backwards compatibility
  if (opts.include_docs) {
    params.include_docs = true
  };

  return this.db.view(name, viewName, params)
  .then(function (results) {

    if (opts.raw) {
      return results;
    }
    else {
      return results[0].rows.map(function (i) {
        if (params.include_docs) {
          return i.doc;
        }
        return i.value;
      });
    }
  });
};

Collection.prototype.pages = function (opts) {

};

Collection.prototype.put = function (obj) {
  var item = new Item(obj, this);
  this.emit('put:before', {data: obj, item: item});

  return item.save()
  .then(function (results) {
    this.emit('put', {data: obj, item: item, results: results}); // in case someone just attaches to 'put'
    this.emit('put:after', {data: obj, item: item, results: results});
    return results;
  }.bind(this));
};

Collection.prototype.form = function (opts) {
  return makeForm(this, opts);
};

Collection.prototype.setup = function () {
  var doc = helpers.designDoc(this);
  var self = this;
  var ensureStaticDocs = [];

  if (this.collection.staticDocs) {
    ensureStaticDocs = this.collection.staticDocs.map(function (staticDoc) {
      return self.db.get(staticDoc._id)
      .catch(function(){
        return self.db.put(staticDoc);
      });
    });
  }

  return Promise.all(ensureStaticDocs)
  .then(function(){
    return self.db.get(doc._id)
    .then(function (curr) {
      if (!curr._rev) {
        curr = curr[0];
      }

      doc._rev = curr._rev;

      var str = JSON.stringify(doc);
      var curr = JSON.stringify(curr);

      if (str !== curr) {
        return self.db.put(doc._id, doc);
      }
      else {
        return curr;
      }
    })
    .catch(function (err) {
      if (err.message === 'missing') {
        return self.db.put(doc._id, doc);
      }
      else {
        throw err;
      }
    });
  });
};

Collection.prototype.delete = function (id) {
  return this.db.destroy(id);
};

Collection.prototype.destroy = function (id) {
  this.emit('destroy', id);
  return this.delete(id);
};

Collection.prototype.fetch = function (ids) {
  return this.db.fetch(ids);
};

Collection.prototype.bulk = function (docs, params) {
  return this.db.bulk(docs, params);
};

Collection.prototype.follow = function (opts, handler) {
  var opts = opts || {}
    , args = {}
    , handler = handler || function(){}
    , feed;

  if (opts.view) {
    args.filter = '_view';
    args.view = this.name + '/' + opts.view;
  }
  else if (opts.filter) {
    if (opts.params) {
      args.query_params = opts.params;
    }
  }
  else if (typeof opts === 'function') {
    handler = opts;
    args.filter = '_view';
    args.view = this.name + '/all';
  }
  else {
    throw new Error('You must specify a handler function');
  }

  args.since = opts.since || 'now';

  feed = this.db.follow(args, handler);

  feed.on('error', function (err) {
    console.log('Error while watching feed: ', err);
  });

  return feed;
};

Collection.prototype.search = function (opts) {
  var fields = this.fields;
  var searchableFields = _.keys(fields).filter(function (k) {
    return (fields[k] === 'string' || fields[k] === 'text');
  });

  if (typeof opts === 'string') {
    opts = {fields: searchableFields, query: opts.toString()};
  }

  opts = _.extend({}, {collection: this.name}, opts);
  return this.app.search(opts);
};

Collection.prototype.seed = function (num, persist) {
  return Promise.all(_.times(num, function () {
    var item = this.app.invoke(this.collection.fake);

    if (persist !== false) {
      return this.put(item);
    }
    else {
      return Promise.resolve(item);
    }
  }, this));
};

Collection.prototype.emit = function (name, data) {
  this._ee.emit(name, data);
};

Collection.prototype.on = function (name, handler) {
  this._ee.on(name, handler);
};

Collection.prototype.extend = function (obj) {
  var newColl = _.extend({}, this);
  return newColl.mergeCollection(obj);
};