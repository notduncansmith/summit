var Promise = require('bluebird')
  , graph = Promise.promisifyAll(require('fbgraph'))
  , _ = require('lodash');

module.exports = FB;

function FB (config) {
  if (typeof config === 'string') {
    this.accessToken = config;
  }
  else {
    this.accessToken = this.appAccessToken(config);
  }

  this.api = _.clone(graph, true);
  this.api.setAccessToken(this.accessToken);
}

FB.prototype.setAccessToken = function (accessToken) {
  this.accessToken = accessToken;
  this.api.setAccessToken(accessToken);
};

FB.prototype.verifyToken = function (token, accessToken) {
  var params = {
    input_token: token,
    access_token: accessToken
  };

  return this.api.getAsync('/debug_token', params)
  .then(function (response) {
    return {
      valid: response.data.is_valid,
      facebookId: response.data.user_id
    };
  });
};

FB.prototype.appAccessToken = function (config) {
  return config.appId + '|' + config.secret;
};

FB.appAccessToken = FB.prototype.appAccessToken;

FB.prototype.getUser = function (id) {
  return this.api.getAsync('/' + id);
};

FB.prototype.getFriendsOf = function (id) {
  return this.api.getAsync('/' + id + '/friends');
};