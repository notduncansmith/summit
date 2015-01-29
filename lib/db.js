var NanoDriver = require('./drivers/database/nano')
  , PouchDriver = require('./drivers/database/pouch');

module.exports = function (config) {
  var driver = PouchDriver;

  if (config.driver === 'nano') {
    driver = NanoDriver;
  }
  else if (typeof config.driver === 'function') {
    driver = config.driver;
  }

  return driver(config);
}