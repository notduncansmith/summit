var Promise = require('bluebird');

module.exports = Twitter;

function Twitter (config) {
  this.config = config;
}

Twitter.prototype.verifyToken = function (token, twitterId) {
  console.warn('TWITTER NOT YET IMPLEMENTED.', 'Using mock interface.');

  return new Promise(function (resolve) {
    var response = {
      valid: true,
      twitterId: twitterId
    };

    resolve(response);
  });
};