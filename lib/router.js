var bogart = require('bogart-edge')
  , _ = require('lodash')
  , VERBS = ['get', 'post', 'put', 'del']
  , Promise = require('bluebird');

module.exports = function (app) {
  var router = bogart.router();

  router.all = all.bind(router, router);
  router.divert = divert.bind(router, app, router);

  VERBS.forEach(function (v) {
    router[v] = _.wrap(router[v], matchedRouteHeader);
  });

  function matchedRouteHeader (fn, route) {
    var args = Array.prototype.slice.call(arguments, 1);

    args.splice(1, 0, function (res, next, env) {
      if (env.dev) {
        res.headers['X-Matched-Route'] = route;
      }

      return next();
    });

    return fn.apply(router, args);
  }
  return router;
};


function all (router, path, handler) {
  VERBS.forEach(function (verb) {
    router[verb](path, handler);
  });
}

function divert (app, router, paths, handler) {
  paths.forEach(function (p) {
    router.all(p, function (next) {
      var canAccess = app.invoke(handler);

      if (canAccess === true) {
        return next();
      }
      else {
        return bogart.redirect(canAccess);
      }
    });
  });
}