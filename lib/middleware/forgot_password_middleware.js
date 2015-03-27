var bogart = require('bogart-edge');

module.exports = function (app) {
  var router = app.router(false);

  router.post('/forgot-password', function (req, respond, views, ForgotPassword) {
    return ForgotPassword.withEmail(req.params.email)
    .then(function () {
      return bogart.redirect('/forgot-password/success');
    })
    .catch(function (err) {
      return bogart.redirect('/forgot-password?error=' + err);
    });
  });

  router.get('/forgot-password', function (req, respond, views) {
    return respond(views.user.forgot_password, {alert: req.params.error});
  });

  router.get('/forgot-password/success', function (respond, views) {
    return respond(views.user.forgot_password_success);
  });

  router.get('/reset-password', function (req, respond, views, ForgotPassword) {
    var token = req.params.token;

    return ForgotPassword.withToken(token)
    .then(function (result) {
      if (result.valid) {
        return respond(views.user.reset_password, {token: token});
      }
      else {
        return respond(views.user.reset_password, {error: result.reason});
      }
    })
    .catch(function (err) {
      return respond(views.user.reset_password, {error: err});
    });
  });

  router.post('/reset-password', function (req) {
    return resetPassword(req.params.token, req.params.password)
    .then(function (savedUser) {
      return bogart.redirect('/login');
    });
  });

  router.post('/api/forgot-password', function (req, ForgotPassword) {
    return ForgotPassword.withEmail(req.params.email)
    .then(function (response) {
      return bogart.json({it: 'worked'});
    });
  });

  router.post('/api/reset-password', function (req, ForgotPassword) {
    return resetPassword(req.params.token, req.params.password)
    .then(function (response) {
      return bogart.json({it: 'worked'});
    });
  });

  function resetPassword (token, password) {
    return app.db.get(token)
    .then(function (token) {
      var token = token[0] || token;
      return app.db.get(token.userId)
    })
    .then(function (user) {
      var user = user[0] || user;
      var coll = app.collections[user.type || user.collection];

      return coll.updateUserPassword(user._id, password);
    });
  }

  return router;
};