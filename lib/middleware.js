var bogart = require('bogart-edge')
  , _ = require('lodash');

module.exports = function middleware (app) {
  var middlewares = {
    error: require('./middleware/error_middleware'),
    CORS: require('./middleware/cors_middleware'),
    user: require('./middleware/user_middleware'),
    defaultLocals: require('./middleware/default_locals_middleware')
  };

  if (app) {
    middlewares = _.extend({}, middlewares, {
      attachments: require('./middleware/attachments_middleware')(app),
      facebook: require('./middleware/facebook_middleware')(app),
      not_found: require('./middleware/not_found_middleware')(app),
      forgot_password: require('./middleware/forgot_password_middleware')(app)
    });
  }

  return _.extend({}, bogart.middleware, middlewares);
};