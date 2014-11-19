module.exports = function middleware (app) {
  var middlewares = {
    attachments: require('./middleware/attachments')(app),
    facebook: require('./middleware/facebook')(app),
    not_found: require('./middleware/not_found')(app),
    forgot_password: require('./middleware/forgot_password_middleware')(app),
    error: require('./middleware/error')
  };

  return middlewares;
}