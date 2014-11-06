var Page = require('./page')
  , Post = require('./post')
  , router = require('./router')
  , services = require('./services')
  , path = require('path');

module.exports = function (app) {
  app.plugin({
    name: 'CMS',
    collections: [Page, Post],
    router: router,
    services: services,
    viewDir: path.join(__dirname, 'views')
  });
};