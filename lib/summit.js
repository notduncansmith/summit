var Database = require('./db')
  , hbs = require('./handlebars')
  , makeRouter = require('./router')
  , Collection = require('./collection')
  , middleware = require('./middleware')
  , Mailer = require('./mailer')
  , ForgotPassword = require('./forgot_password')
  , Plugin = require('./plugin')
  , configure = require('./configure')
  , FB = require('./fb')
  , Twitter = require('./twitter')
  , _ = require('lodash')
  , bogart = require('bogart-edge')
  , uuid = require('node-uuid').v4
  , Promise = require('bluebird')
  , inflection = require('inflection')
  , path = require('path');

function Summit (userConfig) {
  var viewDir = path.join(Summit.maindir(), 'views');

  this.config = configure(userConfig);
  this.env = this.config.environment;
  this.app = bogart.app();

  this.collections = {};
  this.templateGlobals = {};
  this.plugins = {};
  this.viewDirs = [viewDir];
  this.routers = [];
  this.db = new Database(this.config.db);
  this.injector = this.app.injector;

  if (this.config.facebook) {
    this.fb = new FB(this.config.facebook);
    this.inject('FB', this.fb);
  }

  if (this.config.twitter) {
    this.twitter = new Twitter(this.config.twitter);
    this.inject('Twitter', this.twitter);
  }

  this.inject('app', this);
  this.inject('env', this.env);
  this.inject('_', _);
  this.inject('uuid', uuid);
  this.middleware = middleware(this);

  this.use(this.middleware.error());
  this.use(bogart.middleware.parted());
  this.use(bogart.middleware.session({secret: this.env.sessionSecret, lifetime: this.env.sessionLifetime}));
  this.use(bogart.middleware.bodyAdapter);

  this.use(function (req, next) {
    req.env = _.extend({}, req.env);
    return next();
  });


  Mailer(this);
  ForgotPassword(this);
}

Summit.prototype.router = function (use) {
  var router = makeRouter(this);

  if (use === false) {
    return router;
  }
  else {
    this.routers.push(router);
  }

  return router;
};

Summit.prototype.use = function (middleware) {
  this.app.use.call(this.app, middleware);
};

Summit.prototype.collection = function collection (c) {
  if (typeof c === 'string') {
    return this.collections[c];
  }

  var coll = new Collection(c, this);
  this.collections[c.name] = coll;
  this.inject(c.name, coll);

  return coll;
};

Summit.prototype.userCollections = function() {
  return _.where(_.values(this.collections), {isUserType: true});
};

Summit.prototype.inject = function (name, value, isFactory) {
  if (isFactory) {
    this.app.injector.factory.call(this.app.injector, name, value);
  }
  else {
    this.app.injector.value.call(this.app.injector, name, value);
  }
};

Summit.prototype.invoke = function (fn) {
  return this.app.injector.invoke.call(this.app.injector, fn);
};

Summit.prototype.plugin = function (pluginData) {
  var plugin = new Plugin(this, pluginData);

  plugin.collections = plugin.registerCollections();

  this.inject(plugin.name, plugin.injectable());
  this.plugins[plugin.name] = plugin;
  this.viewDirs.push(plugin.viewDir);
};

Summit.prototype.start = function (port) {
  var self = this;

  return this._setup()
  .then(function () {
    self.app.start(port || self.env.port);
  })
  .catch(function (err) {
    console.log('FAILED TO START APP');
    console.log(err);
  });
};
Summit.prototype._setup = function () {
  var self = this;

  this.use(function (req, next) {
    var user = req.session('user');

    if (!user) {
      user = false;
    }

    self.inject('user', function () {
      return user;
    }, true);
    
    return next();
  });

  var hbsMiddleware = hbs(this.viewDirs)
  .onCreateLocals(function (user, app) {
    // Globally available locals

    var locals = {
      config: self.config,
      env: self.config.environment,
      theme: app.theme,
      loggedIn: !!user,
      user: user
    };

    return _.extend({}, locals, app.templateGlobals);
  });
  
  this.use(hbsMiddleware);

  this.use(this.middleware.forgot_password);
  this.use(this.middleware.attachments);
  this.use(bogart.middleware.directory(path.join(bogart.maindir(), 'assets')));
  this.use(bogart.middleware.directory(path.join(bogart.maindir(), 'node_modules/summit/cms/assets')));

  
  this.routers.forEach(function (r) {
    self.use(r);
  });

  _.values(this.plugins).forEach(function (p) {
    // Apply plugin routes
    var router = self.invoke(p.router);
    self.use(router);
  });
  
  

  // Included last, of course
  this.use(this.middleware.not_found);

  // Make sure database exists
  return this.db.createDb(this.config.db.name)
  .then(function () {
    // Call collection setup methods
    return _.keys(self.collections)
    .map(function (c) {
      return self.collections[c].setup()
      .catch(function (err) {
        console.log('Failed to set up collection ' + c);
        console.log('Please make sure CouchDB is running and your credentials are configured correctly.');
        process.exit(1);
      });
    });
  })
  .catch(function (err) {
    console.log(err);
    console.log('Failed to create database');
    console.log('Please make sure CouchDB is running and your credentials are configured correctly.');
    process.exit(1);
  });
};

module.exports = function () {
  var helpers = [
      'res'
    , 'file'
    , 'text'
    , 'html'
    , 'json'
    , 'cors'
    , 'error'
    , 'redirect'
    , 'permanentRedirect'
    , 'notModified'
    , 'maindir'
  ];

  helpers.forEach(function (h) {
    Summit[h] = bogart[h];
  });

  Summit._ = _;
  Summit.inflection = inflection;
  Summit.Promise = Promise;
  Summit.uuid = uuid;
  Summit.Facebook = FB;

  return Summit;
};