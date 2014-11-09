var bogart = require('bogart-edge')
  , FB = require('../fb')
  , _ = require('lodash')
  , Promise = require('bluebird');

module.exports = function facebook (app) {
  var router = app.router(false);

  router.get('/facebook/login', function facebookLogin (req, next) {
    
    return app.fb.verifyToken(req.params.token)
    .then(function (response) {

      if (!response.valid) {
        throw new Error('invalid token')
      }
      
      req.session('facebookAccessToken', req.params.token);
      var fb = new FB(req.params.token)

      var userCollections = _.where(app.collections, {isUserType: true});
      var lookups = userCollections.map(function (c) { return c.findByFacebookId(response.facebookId); });
      
      return Promise.all(lookups)
      .then(function (resultSets) {
        req.foundUsers = _.flatten(resultSets);
        
        if (req.foundUsers.length === 0) {
          return fb.getUser(response.facebookId);
        }
        else {
          return Promise.resolve(undefined);
        }
      })
      .then(function (fbUser) {
        req.facebookUser = fbUser;
        return next();
      });
    });
  });

  router.all('*', function (req, injector, next) {
    var userToken, appToken;
    
    if (req.session('facebookAccessToken')) {
      userToken = req.session('facebookAccessToken')
      injector.value('FB', new FB(userToken))
    }

    return next();
  });

  return router;
}