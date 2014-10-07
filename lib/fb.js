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

FB.prototype.myFriends = function () {
  return this.api.getAsync('/me/friends?limit=10000&offset=0')
  .get('data');
};

FB.prototype.mutualFriendCount = function (id) {
  return this.api.getAsync('/v2.1/' + id + '?fields=context.fields(mutual_friends)')
  .get('context')
    .get('mutual_friends')
      .get('summary')
        .get('total_count');
};

FB.prototype.friendsOfFriends = function(id) {
  var id = id || 'me'
  return this.api.getAsync('/v2.1/' + id + '?fields=friends.limit(10000){name, id, friends.limit(10000)}')
  .get('friends')
  .get('data')
  .then(function (friends) {
    return _(friends)
      .pluck('friends')
      .pluck('data')
      .union()
      .value()
      .concat(friends);
  })
};