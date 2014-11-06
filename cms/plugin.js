var Page = require('./page')
  , Post = require('./post')
  , router = require('./router')
  , services = require('./services');

module.exports = function (app) {
  app.plugin({
    name: 'CMS'
    collections: [Page, Post],
    router: router,
    services: services
  });
};