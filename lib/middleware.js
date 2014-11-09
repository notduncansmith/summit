module.exports = function middleware (app) {
  var middlewares = {
    attachments: require('./middleware/attachments')(app),
    facebook: require('./middleware/facebook')(app),
    not_found: require('./middleware/not_found')(app)
  };

  return middlewares;
}