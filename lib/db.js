var NanoDriver = require('./drivers/database/nano')
  , PouchDriver = require('./drivers/database/pouch');

module.exports = function (app, config) {
  var driver = PouchDriver;

  switch (config.db.driver) {
    case 'pouch': break;
    case 'nano':
      driver = NanoDriver;
      break;
    default:
      driver = config.db.driver;
      break;
  }

  return app.invoke(driver);
}