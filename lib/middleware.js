module.exports = function middleware (Summit) {
  var middlewares = {
    attachments: require('./middleware/attachments').apply(Summit),
    facebook: require('./middleware/facebook').apply(Summit)
  };

  return middlewares;
}