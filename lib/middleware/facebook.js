var bogart = require('bogart-edge')
  , FB = require('../fb')
  , _ = require('lodash')
  , Promise = require('bluebird');

module.exports = function facebook () {
  var router = bogart.router()
    , self = this;

  router.get('/facebook/login', function facebookLogin (req, next) {
    
    return self.fb.verifyToken(req.params.token)
    .then(function (response) {
      console.log(response)
      if (!response.valid) {
        throw new Error('invalid token')
      }
      
      req.session('facebookAccessToken', req.params.token);
      var fb = new FB(req.params.token)

      var userCollections = _.where(self.collections, {isUserType: true});
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
    })
    .catch(function (err) {
      console.log('ERROR: ', err);
      req.error = err;
      if (req.retries) {
        req.retries += 1;
      }
      else {
        req.retries = 1;
      }

      console.log('Retrying, attempt #' + req.retries)
      console.log('Extending with config: ', self.config)
      return FB.extendAccessToken({
        access_token: req.params.token,
        client_id: self.config.facebook.appId,
        client_secret: self.config.facebook.secret
      })
      .then(function (response) {
        console.log('Refreshed token: ', response)
        return facebookLogin(req, next);
      });
    });
  });

  router.get('*', function (req, injector, next) {
    var userToken, appToken;
    
    if (req.session('facebookAccessToken')) {
      userToken = req.session('facebookAccessToken')
      injector.value('FB', new FB(userToken))
    }

    return next();
  });

  return router;
}