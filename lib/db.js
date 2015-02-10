var NanoDriver = require('./drivers/database/nano')
  , PouchDriver = require('./drivers/database/pouch');

module.exports = function (app, config) {
  var driver = PouchDriver;

  if (config.db.driver === 'nano') {
    driver = NanoDriver;
  }
  else if (typeof config.db.driver === 'function') {
    driver = config.db.driver;
  }

  return app.invoke(driver);
}