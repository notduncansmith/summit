var _ = require('underscore');

var Handlebars = require('handlebars');
require('handlebars-layouts')(Handlebars);

var handlebarsLoadTree = require('handlebars-load-tree');

function BogartHandlebarsMiddleware(viewPaths, options) {
  if (!viewsPath) {
    throw new Error('bogart-handlebars missing required parameter `viewsPath`');
  }

  options = _.defaults(options || {}, {
    watch: 1000
  });

  var views = viewPaths.map(function (viewPath) {
    return handlebarsLoadTree(Handlebars, viewPath, options);
  });

  var onCreateLocalsCallbacks = [];

  var callback = function bogartHandlebarsCallback(injector, next) {
    var localsDefaults = {};

    return views.then(function (views) {
      injector.value('views', views);

      onCreateLocalsCallbacks.forEach(function (cb) {
        var locals = injector.invoke(cb);
        localsDefaults = _.extend({}, localsDefaults, locals);
      });

      injector.factory('respond', function (views) {
        return function (view, locals, opts) {
          if (!_.isFunction(view)) {
            throw new Error('respond(view, locals, opts) expected view to be a function, '+typeof(view));
          }
          locals = _.extend({}, localsDefaults, locals);

          var body = view(locals);

          return {
            status: 200,
            body: body,
            headers: {
              "content-length": Buffer.byteLength(body)
            }
          };
        };
      });

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
