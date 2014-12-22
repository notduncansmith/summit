var bogart = require('bogart-edge')
  , inflection = require('inflection')
  , helpers = require('./collection_helpers')
  , util = require('../util');

module.exports = {
  methodRoutes: makeMethodRoutes,
  apiRoutes: makeApiRoutes
};

function makeMethodRoutes (collection) {
  var router = collection.router;

  for (var k in collection.methods) {
    console.log(k);

    if (k.indexOf('$GET') === k.length - 4) {
      GET(k);
      collection.methods[k.replace('$GET', '')] = collection.methods[k];
    }
    else if (k.indexOf('$POST') === k.length - 5) {
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
    return '/' + helpers.routeSafeName(collection.name) + '/' + helpers.routeSafeName(methodName);
  }

  function getView (views, methodName) {
    var viewDir = views[helpers.fileSafeName(collection.name)] || {};
    return viewDir[helpers.fileSafeName(methodName)];
  }
}

function makeApiRoutes (collection) {
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