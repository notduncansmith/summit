var bogart = require('bogart-edge');

module.exports = function (app) {
  var router = bogart.router();

  router.all = all.bind(router, router);
  router.divert = divert.bind(router, app, router);

  return router;
};

function all (router, path, handler) {
  var verbs = ['get', 'post', 'put', 'del'];

  verbs.forEach(function (verb) {
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