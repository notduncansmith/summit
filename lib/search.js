var ElasticsearchDriver = require('./drivers/search/elasticsearch')
  , PouchDriver = require('./drivers/database/pouch');

module.exports = function (config) {
  var driver = PouchDriver;

  if (config.driver === 'elasticsearch') {
    driver = ElasticsearchDriver;
  }
  else if (typeof config.driver === 'function') {
    driver = config.driver;
  }

  return driver(config);
}