
module.exports = function (app, config) {
  var driver;

  switch (config.db.driver) {
    case 'pouch': 
      driver = require('./drivers/database/pouch');
      break;
    case 'nano':
      driver = require('./drivers/database/nano');
      break;
    default:
      driver = config.db.driver;
      break;
  }

  return app.invoke(driver);
}