var _ = require('lodash')
  , makeForm = require('./collection/forms.js')
  , Promise = require('bluebird')
  , Item = require('./collection/item')
  , UserCollection = require('./collection/user')
  , GroupCollection = require('./collection/group')
  , routeHelpers = require('./collection/collection_routes')
  , helpers = require('./collection/collection_helpers');

module.exports = Collection;

function Collection (collection, app) {
  this.router = app.router();

  this.name = collection.name;
  this.app = app;
  this.db = app.db;
  this.collection = collection;
  this.mergeCollection(collection);

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
        if (doc.collection === '{{name}}') {
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
  this.methods = _.extend({}, this.methods, collection.methods);

  if (collection.timestamps !== false) {
    this.timestamps = true;
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
  var name = helpers.dbSafeName(this.collection.name)
    , params = params || {};

  return this.db.update(name, updateName, docId, params);
};

Collection.prototype.view = function (viewName, params, opts) {
  var name = helpers.dbSafeName(this.collection.name)
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
  return item.save();
};

Collection.prototype.form = function (opts) {
  return makeForm(this, opts);
};

Collection.prototype.setup = function () {
  var doc = helpers.designDoc(this);
  var self = this;

  return this.db.get(doc._id)
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
};

Collection.prototype.delete = function (id) {
  return this.db.destroy(id);
};

Collection.prototype.destroy = function (id) {
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

Collection.prototype.search = function (opts, filtered) {
  var matchField = opts.exact === false ? 'term' : 'match';
  delete opts.exact;

  var args = {
    filtered: {
      query: {},
      filter: {
        and:[]
      }
    }
  };
  if (!filtered){
    delete args.filtered.filter.and;
    args.filtered.filter = {query:{match:{collection: this.name}}};
  }else{
    filtered.map(function(filteredCollection){
      args.filtered.filter.and.push({match_all:{collection: filteredCollection}});
    })
  }

  if (_.isArray(opts)) {
    return Promise.all(opts.map(this.search.bind(this)));
  }

  if (typeof opts === 'string') {
    args.filtered.query.query_string = {query: opts, phrase_slop: 3};
    return this.db.search({query: args});
  }

  args.filtered.query[matchField] = opts;

  if (opts.query) {
    return this.db.search(opts.query);
  }

  if (opts.size) {
    args.size = opts.size;
  }

  if (opts.page) {
    args.size = args.size || 10;
    args.from = args.size * (opts.page - 1);
  }

  return this.db.search({query: args});
};

Collection.prototype.seed = function (num, persist) {
  return Promise.all(_.times(num, function () {
    var item = this.app.invoke(this.collection.fake);

    if (persist !== false) {
      if (this.collection.isUserType) {
        return this.register(item);
      }
      return this.put(item);
    }
    else {
      return Promise.resolve(item);
    }
  }, this));
};
