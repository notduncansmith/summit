module.exports = function (app, user, locals, next) {
  locals.config = app.config;
  locals.user = user;
  locals.loggedIn = !!user;
  locals.env = app.config.environment;
  locals.theme = app.theme;

  return next();
}