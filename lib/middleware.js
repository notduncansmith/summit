module.exports = function middleware (app) {
  var middlewares = {
    attachments: require('./middleware/attachments_middleware')(app),
    facebook: require('./middleware/facebook_middleware')(app),
    not_found: require('./middleware/not_found_middleware')(app),
    forgot_password: require('./middleware/forgot_password_middleware')(app),
    error: require('./middleware/error_middleware')
  };

  return middlewares;
};