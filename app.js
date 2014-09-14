var CMS = require('./lib/cms');

module.exports = function (config) {
  return new CMS(config);
}