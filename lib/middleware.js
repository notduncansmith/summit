module.exports = function middleware (Cms) {
  var middlewares = {
    attachments: require('./middleware/attachments').apply(Cms),
    facebook: require('./middleware/facebook').apply(Cms)
  };

  return middlewares;
}