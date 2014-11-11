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
  this.name = collection.name;
  this.app = app;
  this.db = app.db;
  this.collection = collection;
  this.mergeCollection(collection);

  if (collection.restful) {
    this._rest();
  }
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
  _.extend(this, this.app.invoke(collection.classMethods || function(){}));
  
  if (collection.timestamps !== false) {
    this.timestamps = true;
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

Collection.prototype.update = function (updateName, docId, params) {
  var name = inflection.classify(this.collection.name)
    , params = params || {};

  return this.db.update(name, updateName, docId, params);
};

Collection.prototype.view = function (viewName, params, opts) {
  var name = inflection.classify(this.collection.name)
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
  return this.db.put(doc._id, doc, true);
};

Collection.prototype.delete = function (id) {
  return this.db.destroy(id);
};

Collection.prototype.destroy = function (id) {
  return this.delete(id);
};

Collection.prototype._rest = function () {
  this.router = makeApiRouter(this);
};

function makeApiRouter (collection) {
  // Get a new router
  var router = collection.app.router.call(collection.app);
  var name = inflection.dasherize(collection.name.toLowerCase());

  function makePath (path) {
    return '/api/' + name + path;
  }

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

  return router;
}

function designDoc (collection) {
  var name = inflection.classify(collection.name);

  var newDesignDoc = {
    _id: "_design/" + name
  };

  var stringified = _.mapValues(collection.design, function (e) {
    return util.stringifyFunctions(e, collection);
  });

  return _.extend({}, newDesignDoc, stringified);
}

function mergeDesignDocs(one, two) {
  var newDesignDoc = {};

  for (var key in one) {
    newDesignDoc[key] = _.extend({}, one[key], two[key])
  }

  return newDesignDoc;
}