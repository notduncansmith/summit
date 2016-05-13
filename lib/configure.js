var _ = require('lodash');

module.exports = function defaultConfig (userConfig) {
  var userConfig = userConfig || {};

  var hostname = process.env.HOSTNAME || 'localhost'
    , port = process.env.PORT || 1337
    , protocol = process.env.PROTOCOL || 'http'
    , hazSSL = (userConfig && userConfig.environment && userConfig.environment.ssl && userConfig.environment.ssl.key && userConfig.environment.ssl.cert)
    , ssl = null;

  if (hazSSL) {
    ssl = {key: userConfig.environment.ssl.key, cert: userConfig.environment.ssl.cert};
  }

  // default configuration options
  var config = {
    trustDb: false,

    environment: {
      name: process.env.APPNAME || 'My Awesome App',
      host: hostname,
      port: port,
      url: process.env.url || 'http://localhost:1337',
      dev: process.env.DEVELOPMENT || true,
      sessionSecret: 'ch4n9e_m#_b4_d3pl0yin9_7o_pr0duct1oN!',
      sessionLifetime: 259200, // (in seconds) 3 days
      ssl: ssl
    },

    db: {
      host: process.env.DBHOST || 'localhost',
      port: process.env.DBPORT || 5985,
      name: process.env.DBNAME || 'summit',
      https: process.env.DBHTTPS || false,
      auth: process.env.DBAUTH || '', // username:password
      driver: process.env.DBDRIVER || 'pouch',

      search: {
        driver: process.env.SEARCHDRIVER || 'pouch',
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

  if (typeof userConfig === 'string') {
    // Must be a DB name
    config.db.name = userConfig;
  }
  else {
    // Must be config object
    config = _.merge(config, userConfig);
  }

  if (config.db.driver === 'nano' && !userConfig.db.port) {
    config.db.port = 5984;
  }

  if (!(userConfig && userConfig.environment && userConfig.environment.url) && config.environment.port != 80 && config.environment.port != 443) {
    config.environment.url += ':' + port;
  }

  return config;
};