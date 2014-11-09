var _ = require('lodash')
  , Promise = require('bluebird');

var Handlebars = require('handlebars');
require('handlebars-layouts')(Handlebars);

var handlebarsLoadTree = require('handlebars-load-tree');

function BogartHandlebarsMiddleware(viewPaths, options) {
  if (!viewPaths || viewPaths.length == 0) {
    throw new Error('bogart-handlebars missing required parameter `viewsPath`');
  }

  options = _.defaults(options || {}, {
    watch: 1000
  });

  var loadViews = viewPaths.map(function (viewPath) {
    return handlebarsLoadTree(Handlebars, viewPath, options);
  })

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

      app.inject('respond', function (views) {
        return function (view, locals, opts) {
          if (!_.isFunction(view)) {
            throw new Error('respond(view, locals, opts) expected view to be a function, '+typeof(view));
          }
          locals = _.extend({}, localsDefaults, locals);

          var body = view(locals);
          return {
            status: 200,
            body: [body],
            headers: {
              "content-type": 'text/html',
              "content-length": Buffer.byteLength(body)
            }
          };
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

module.exports = BogartHandlebarsMiddleware;
