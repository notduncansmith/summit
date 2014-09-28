var bogart = require('bogart-edge')
  , FB = require('../fb')
  , _ = require('lodash')
  , Promise = require('bluebird');

module.exports = function facebook () {
  var router = bogart.router()
    , self = this
    , config = this.config.facebook
    , appAccessToken = FB.appAccessToken(config);

  router.get('/facebook/login', function (req, next) {
    var fb = new FB(appAccessToken);
    
    return fb.verifyToken(req.params.token)
    .then(function (response) {
      if (!response.valid) {
        throw new Error('invalid token')
      }
      var userCollections = getUserCollections(self);
      var lookups = userCollections.map(function (c) { return c.findByFacebookId(response.facebookId); });
      
      return Promise.all(lookups)
      .then(function (resultSets) {
        req.foundUsers = _.flatten(resultSets);
        
        if (req.foundUsers.length === 0) {
          return fb.getUser(response.facebookId);
        }
        else {
          return Promise.resolve(null);
        }
      })
      .then(function (fbUser) {
        req.facebookUser = fbUser;
        return next();
      });
    })
    .catch(function (err) {
      req.error = err;
      return next();
    });
  });

  return router;
}

function getUserCollections (cms) {
  return _.keys(cms.collections)
  .filter(function (key) { 
    return cms.collections[key].collection.isUserType;
  })
  .map(function (key) {
    return cms.collections[key];
  });
}