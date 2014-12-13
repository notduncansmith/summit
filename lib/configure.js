var _ = require('lodash');

module.exports = function defaultConfig (userConfig) {
  var hostname = process.env.HOSTNAME || 'localhost'
    , port = process.env.PORT || 1337
    , protocol = process.env.PROTOCOL || 'http'
    , url = process.env.URL || protocol + ':// ' + hostname;

  if (port !== 80) {
    url += ':' + port;
  }

  // default configuration options
  var config = {
    environment: {
      host: hostname,
      port: port,
      url: url,
      dev: process.env.DEVELOPMENT || true,
      sessionSecret: 'ch4n9e_m#_b4_d3pl0yin9_7o_pr0duct1oN!'
    },

    db: {
      host: process.env.DBHOST || 'localhost',
      port: process.env.DBPORT || 5984,
      name: process.env.DBNAME || 'summit',
      https: process.env.DBHTTPS || 'false',
      auth: process.env.DBAUTH || '', // username:password
      elasticsearch: {
        host: process.env.ESHOST || process.env.DBHOST || 'localhost',
        port: process.env.ESPORT || '9200'
      },
    },

    mandrill: {
      apiKey: process.env.MANDRILL_API_KEY || 'VPW0u0VzBEeogFMW4o3jHA',
      fromEmail: process.env.MANDRILL_FROM_EMAIL || 'test-from@whiteboard-it.com',
      fromName: process.env.MANDRILL_FROM_NAME || 'The Localhost Team'
    },

    facebook: {
      appId: process.env.FB_CLIENT_ID || '',
      secret: process.env.FB_CLIENT_SECRET || ''
    },

    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || ''
    }
  };

  if (!userConfig) {
    return config;
  }

  if (typeof userConfig === 'string') {
    // Must be a DB name
    config.db.name = userConfig;
  }
  else {
    // Must be config object

    // Deep extend
    config = _.transform(config, function (result, val, key) {
      result[key] = _.extend({}, val, userConfig[key]);
    });
  }

  return config;
};