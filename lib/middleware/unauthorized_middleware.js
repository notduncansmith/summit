module.exports = function (app) {
  return function unauthorized (req, views, respond, next) {
    if (req.pathInfo !== '/unauthorized') {
      return next();
    }

    return respond(views.unauthorized);
  };
};
