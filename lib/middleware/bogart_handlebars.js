var bogartHandlebars = require('bogart-handlebars')
  , path = require('path')
  , bogart = require('bogart-edge')
  , url = require('url')
  , config = require('../../config.js');

module.exports = function () {
  var viewPath = path.join(bogart.maindir(), 'views');

  return bogartHandlebars(viewPath, { watch: 1000 })
  .onCreateLocals(function injectLocals (req, session) {

    // Here we inject any locals that 
    // should automatically appear
    // in every view.

    var locals = {};

    locals.env = config.environment;

    // Inject alerts
    if (req.queryString) {
      var fullPath = req.pathInfo + '?' + req.queryString;
      var query = url.parse(fullPath, true).query;
      
      if (query.error) {
        locals.alert = {
          error: {
            message: '<strong>Oh no!</strong> ' + query.error,
            action: query.action || '#'
          }
        };
      }

      if (query.success) {
        locals.alert = {
          success: {
            message: '<strong>Sweet!</strong> ' + query.success,
            action: query.action || '#'
          }
        };
      }
    }

    locals.user = session('user');
    locals.isLoggedIn = !!session('user');

    return locals;
  });
}