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

  router.get('/forgot-password', function (respond, views) {
    return respond(views.user.forgot_password);
  });

  router.get('/forgot-password/success', function (respond, views) {
    return respond(views.user.forgot_password_success);
  });

  router.get('/reset-password', function (req, respond, views, ForgotPassword) {
    return ForgotPassword.withToken(req.params.token)
    .then(function (result) {
      if (result.valid) {
        return respond(views.user.reset_password);
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
    var password = req.params.password;

    return app.db.get(req.params.userId)
    .then(function (user) {
      var coll = app.collections[user.collection];
      user.password = password;

      return coll.user(user);
    })
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
    var password = req.params.password;

    return ForgotPassword.withToken(req.params.token)
    .then(function (fpRecord) {
      return app.db.get(fpRecord.userId);
    })
    .then(function (user) {
      var coll = app.collections[user.collection];
      user.password = password;
      return coll.user(user);
    })
    .then(function (response) {
      return bogart.json({it: 'worked'});
    });
  });

  return router;
}