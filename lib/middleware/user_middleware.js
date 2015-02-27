module.exports = function (req, injector, next) {
  injector.factory('user', function (req) {
    var user = req.session('user');

    if (!user) {
      user = null;
    }

    return user;
  });

  injector.factory('session', function (req) {
    return req.session;
  });

  return next();
}