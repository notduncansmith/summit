var ElasticsearchDriver = require('./drivers/search/elasticsearch')
  , PouchDriver = require('./drivers/search/pouch');

module.exports = function (app, config) {
  var driver = PouchDriver;

  if (config.driver === 'elasticsearch') {
    driver = ElasticsearchDriver;
  }
  else if (typeof config.driver === 'function') {
    driver = config.driver;
  }

  return app.invoke(driver);
}