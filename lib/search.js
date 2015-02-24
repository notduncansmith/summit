var ElasticsearchDriver = require('./drivers/search/elasticsearch')
  , PouchDriver = require('./drivers/search/pouch')
  , _ = require('lodash');

module.exports = function (app, config) {
  var driver = PouchDriver;

  if (!config.db || !config.db.search || !config.db.search.driver) {
    return app.invoke(driver);
  }

  if (config.db.search.driver === 'elasticsearch') {
    driver = ElasticsearchDriver;
  }
  else if (config.db.search.driver) {
    driver = config.driver;
  }

  return app.invoke(driver);
}