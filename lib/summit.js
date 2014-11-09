var Database = require('./db')
  , hbs = require('./handlebars')
  , makeRouter = require('./router')
  , Collection = require('./collection')
  , middleware = require('./middleware')
  , Plugin = require('./plugin')
  , configure = require('./configure')
  , FB = require('./fb')
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
  this.plugins = {};
  this.viewDirs = [viewDir];
  this.routers = [];

  this.db = new Database(this.config.db);
  
  this.middleware = middleware(this);
  this.fb = new FB(this.config.facebook);
  this.inject('app', this);
  this.inject('env', this.env);
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
  this.app.use(middleware);
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

Summit.prototype.inject = function (name, value, isFactory) {
  if (isFactory) {
    this.app.injector.factory(name, value);
  }
  else {
    this.app.injector.value(name, value);
  }
};

Summit.prototype.invoke = function (func) {
  var invoke = this.app.injector.invoke.bind(this.app.injector);
  return invoke(func);
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
    self.app.start(port || 1337);
  })
  .catch(function (err) {
    console.log('FAILED TO START APP');
    console.log(err);
  });
};

Summit.prototype._setup = function () {
  var self = this;

  this.inject('user', function (session) {
    return session('user');
  }, true);

  var hbsMiddleware = hbs(this.viewDirs)
  .onCreateLocals(function (req) {
    // Globally available locals

    var locals = {
      env: self.config.environment,
      loggedIn: !!req.session('user')
    };

    if (req.session('user')) {
      locals.user = req.session('user');
    }

    return locals;
  });



  this.use(bogart.middleware.error());
  this.use(bogart.middleware.parted());
  this.use(bogart.middleware.session({secret: this.config.environment.sessionSecret}));
  this.use(bogart.middleware.bodyAdapter);
  
  this.use(hbsMiddleware);
  this.routers.forEach(this.use.bind(this));

  _.values(this.plugins).forEach(function (p) {
    // Apply plugin routes
    var router = self.invoke(p.router);
    self.use(router);
  });

  this.use(bogart.middleware.directory(path.join(bogart.maindir(), 'assets')));
  
  // 404 should be abstracted,
  this.use(function (views, respond) {

    if (views.not_found) {
      return respond(views.not_found);
    }

    var message = '<h1>Sorry, we couldn\'t find this page.</h1>';

    return {
      status: 404,
      body: [message],
      headers: {
        'content-type': 'text/html',
        'content-length': Buffer.byteLength(message)
      }
    };
  });

  // Make sure database exists
  return this.db.createDb(this.config.db.name)
  .then(function () {

    // Call collection setup methods
    return _.keys(self.collections)
    .map(function (c) {
      return self.collections[c].setup();
    });
  });
};

Summit.prototype._configure = function (userConfig) {
  
  // default configuration options
  var config = {
    environment: {
      host: process.env.HOSTNAME || 'localhost',
      port: process.env.PORT || 1337,
      url: process.env.SPLITTS_HOST || 'http://localhost:1337',
      dev: process.env.DEVELOPMENT,
      sessionSecret: 'ch4n9e_m#_b4_d3pl0yin9_7o_pr0duct1oN!'
    },

    db: {
      host: process.env.DBHOST || 'localhost',
      port: process.env.DBPORT || 5984,
      name: process.env.DBNAME || 'test-db',
      https: process.env.DBHTTPS || "false",
      auth: process.env.DBAUTH || '' // username:password@
    },

    mandrill: {
      apiKey: 'vK7BZJdjRL0JvE5T6NLFsw',
      fromEmail: 'info@appname.com'
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
    config = _.defaults(userConfig, config);
  }

  return config;
}

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