var _ = require('lodash')
  , makeForm = require('./forms.js')
  , inflection = require('inflection')
  , Promise = require('bluebird')
  , Item = require('./item')
  , util = require('./util')
  , UserCollection = require('./user')
  , GroupCollection = require('./group')
  , bogart = require('bogart-edge');

module.exports = Collection;

function Collection (collection, app) {
  this.router = app.router();

  this.name = collection.name;
  this.app = app;
  this.db = app.db;
  this.collection = collection;
  this.mergeCollection(collection);

  if (collection.restful) {
    makeApiRouter(this);
  }

  makeMethodRoutes(this);

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
        if (doc.collection == '{{name}}') {
          emit(doc._id, doc);
        }
      }
    }
  }
};

Collection.prototype.applyCollectionType = function (collectionType) {
  var self = this;

  _.extend(this, collectionType.prototype);
  this.design = mergeDesignDocs(this.design, collectionType.design || {});
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

  this.design = mergeDesignDocs(this.design, collection.design || {});
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

Collection.prototype.all = function (opts) {
  return this.view('all', opts);
};

Collection.prototype.update = function (updateName, docId, params) {
  var name = dbSafeName(this.collection.name)
    , params = params || {};

  return this.db.update(name, updateName, docId, params);
};

Collection.prototype.view = function (viewName, params, opts) {
  var name = dbSafeName(this.collection.name)
    , params = params || {}
    , opts = opts || {};

  return this.db.view(name, viewName, params)
  .then(function (results) {
    if (opts.raw) {
      return results;
    }
    else {
      return results[0].rows.map(function (i) {
        if (opts.include_docs) {
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
  var doc = designDoc(this);
  var self = this;

  return this.db.get(doc._id)
  .get(0)
  .then(function (curr) {
    doc._rev = curr._rev;

    console.log('NEW:', doc);
    console.log('OLD: ', curr);

    var str = JSON.stringify(doc);
    var curr = JSON.stringify(curr);

    if (str !== curr) {
      return self.db.put(doc._id, doc);
    }
    else {
      return curr;
    }
  });
};

Collection.prototype.delete = function (id) {
  return this.db.destroy(id);
};

Collection.prototype.destroy = function (id) {
  return this.delete(id);
};

Collection.prototype.fetch = function(ids){
  return this.db.fetch(ids);
};

Collection.prototype.bulk = function(docs, params){
  return this.db.bulk(docs, params);
};

Collection.prototype.follow = function (opts, handler) {
  var opts = opts || {}
    , args = {}
    , handler = handler || function(){}
    , feed;

  if (opts.view) {
    args.filter = '_view';
    args.view = this.name + '/' + opts.view
  }
  else if (opts.filter) {
    if (opts.params) {
      args.query_params = params;
    }
  }
  else if (typeof opts === 'function') {
    handler = opts;
    args.filter = '_view';
    args.view = this.name + '/all'
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
  var matchField = opts.exact === false ? 'term' : 'match';
  delete opts.exact;

  var args = {
    filtered: {
      query: {},
      filter: {
        query:{match: {collection: this.name} }
      }
    }
  };

  if (_.isArray(opts)) {
    return Promise.all(opts.map(this.search.bind(this)));
  }

  if (typeof opts === 'string') {
    args.filtered.query.query_string = {query: opts, fields: fields, phrase_slop: 3};
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

function makeApiRouter (collection) {
  // Get a router
  var router = collection.router;
  var name = inflection.dasherize(collection.name.toLowerCase());

  router.get(makePath('/all'), function (req) {
    return collection.all()
    .then(function (results) {
      return bogart.json(results);
    });
  });

  router.get(makePath('/:id'), function (req) {
    return collection.get(req.params.id)
    .then(function (results) {
      return bogart.json(results);
    });
  });

  router.post(makePath(''), function (req) {
    var newThing = req.params;

    return collection.put(newThing)
    .then(function (results) {
      return bogart.json(results);
    });
  });

  router.post(makePath('/:id'), function (req) {
    var newThing = req.params;

    newThing._id = newThing.id;
    delete newThing.id;

    return collection.put(newThing)
    .then(function (results) {
      return bogart.json(results);
    });
  });

  function makePath (path) {
    return '/api/' + name + path;
  }

  return router;
}

function designDoc (collection) {
  var name = dbSafeName(collection.name);

  var newDesignDoc = {
    _id: "_design/" + name
  };

  var stringified = _.mapValues(collection.design, function (e) {
    return util.stringifyFunctions(e, collection);
  });

  return _.extend({}, newDesignDoc, stringified);
}

function mergeDesignDocs (one, two) {
  var newDesignDoc = {};

  for (var key in one) {
    newDesignDoc[key] = _.extend({}, one[key], two[key])
  }

  return newDesignDoc;
}

function makeMethodRoutes (collection) {
  var router = collection.router;

  for (var k in collection.methods) {
    console.log(k);

    if (k.indexOf('$GET') == k.length - 4) {
      GET(k);
      collection.methods[k.replace('$GET', '')] = collection.methods[k];
    }
    else if (k.indexOf('$POST') == k.length - 5) {
      POST(k);
      collection.methods[k.replace('$POST', '')] = collection.methods[k];
    }
  }

  function GET (m) {
    router.get(makePath(m), function (injector, req, views, respond) {
      var ctx = {};

      // We need to fill in undefined for any
      // missing parameters the method might be expecting
      // to prevent the injector from blowing up

      util.getArguments(collection[m]).forEach(function (a) {
        ctx[a] = req.params[a] || undefined;
      });

      return injector.invoke(collection[m], collection, ctx)
      .then(function (result) {
        var view = getView(views, m);

        if (view) {
          return respond(view, result);
        }
        else {
          return bogart.json(result);
        }
      });
    });
  }

  function POST (m) {
    router.post(makePath(m), function (injector, req) {
      return injector.invoke(collection[m], collection, req.params)
      .then(function (result) {
        var redirect = req.params.redirect || req.params.redirectTo;

        if (redirect) {
          return bogart.redirect(redirect);
        }
        else {
          return bogart.json(result);
        }
      });
    });
  }

  function makePath (methodName) {
    return '/' + routeSafeName(collection.name) + '/' + routeSafeName(methodName);
  }

  function getView (views, methodName) {
    var viewDir = views[fileSafeName(collection.name)] || {};
    return viewDir[fileSafeName(methodName)];
  }
}

function fileSafeName (name) {
  var name = name
  .replace('$GET', '')
  .replace('$POST', '');

  return inflection.underscore(name);
}

function dbSafeName (name) {
  return inflection.classify(name);
}

function routeSafeName (methodName) {
  var methodName = methodName
  .replace('$GET', '')
  .replace('$POST', '');

  return inflection.dasherize(methodName).toLowerCase();
}