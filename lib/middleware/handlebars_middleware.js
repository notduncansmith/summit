var _ = require('lodash')
  , Promise = require('bluebird')
  , Handlebars = require('handlebars')
  , keypath = require('keypath')
  , handlebarsLoadTree;

// Monkey-patch layout support into Handlebars
require('handlebars-layouts')(Handlebars);

handlebarsLoadTree = require('handlebars-load-tree');

module.exports = BogartHandlebarsMiddleware;

function BogartHandlebarsMiddleware(viewPaths, options) {
  if (!viewPaths || !viewPaths.length) {
    throw new Error('bogart-handlebars missing required parameter `viewsPath`');
  }

  options = _.defaults(options || {}, {
    watch: 1000
  });

  var loadViews = viewPaths.map(function (viewPath) {
    return handlebarsLoadTree(Handlebars, viewPath, options);
  });

  var onCreateLocalsCallbacks = [];

  var callback = function bogartHandlebarsCallback(app, next) {
    var localsDefaults = {};

    return Promise.all(loadViews)
    .then(function (viewMapArray) {
      var views = {};

      viewMapArray.reverse().forEach(function (view) {
        _.extend(views, view);
      });

      app.inject('views', views);

      onCreateLocalsCallbacks.forEach(function (cb) {
        var locals = app.invoke(cb);
        localsDefaults = _.extend({}, localsDefaults, locals);
      });

      var viewResponseMethod = function (view, locals, opts) {
        var body = {};

        if (!_.isFunction(view)) {
          throw new Error('respond(view, locals, opts) expected view to be a function, '+typeof(view));
        }

        locals = _.extend({}, localsDefaults, locals);
        body = view(locals);

        return {
          status: 200,
          body: [body],
          headers: {
            'content-type': 'text/html',
            'content-length': Buffer.byteLength(body)
          }
        };
      }

      app.inject('respond', function (views) {
        return viewResponseMethod;
      }, true);

      app.inject('view', function (views) {
        return function (viewName, locals, opts) {
          var view = keypath(viewName, views);
          return viewResponseMethod(view, locals, opts);
        };
      }, true);

      return next();
    });
  };

  callback.onCreateLocals = function (cb) {
    onCreateLocalsCallbacks.push(cb);
    return callback;
  };

  return callback;
}