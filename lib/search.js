var ElasticsearchDriver = require('./drivers/search/elasticsearch')
  , PouchDriver = require('./drivers/search/pouch')
  , _ = require('lodash');

module.exports = function (app, config) {

  if (!config.db || !config.db.search || !config.db.search.driver) {
    return app.invoke(PouchDriver);
  }

  if (config.db.search.driver === 'elasticsearch') {
    driver = ElasticsearchDriver;
  }
  else if (config.db.search.driver === 'pouch') {
    driver = PouchDriver;
  }

  return app.invoke(driver);
}