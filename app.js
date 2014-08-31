var bogart = require('bogart-edge')
  , path = require('path')
  , config = require('./config')
  , Database = require('./lib/db')
  , sessionSecret = config.environment.sessionSecret
  , assetPath = path.join(bogart.maindir(), 'assets')
  , router = require('./lib/router')
  , handlebars = require('./lib/middleware/bogart_handlebars')();

function createApp () {
  var app = bogart.app();
  app.injector.value('env', process.env);
  
  app.use(bogart.middleware.session({
    secret: sessionSecret
  }));
  
  app.use(function(req, injector, next) {
    app.injector.value('session', req.session);
    app.injector.value('flash', req.flash);
    return next();
  });
  
  app.use(bogart.middleware.error());
  app.use(bogart.middleware.parted());
  app.use(handlebars);
  app.use(router());
  app.use(bogart.middleware.directory(assetPath));

  return app;
};

createApp().start(config.environment.port);