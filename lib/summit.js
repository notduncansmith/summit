var databaseProvider = require('./db')
  , searchProvider = require('./search')

var Timer = require('./helpers/timer')
  , hbs = require('./middleware/handlebars_middleware')
  , makeRouter = require('./router')
  , Collection = require('./collection')
  , Controller = require('./controller')
  , middleware = require('./middleware')
  , mailer = require('./services/mailer')
  , forgotPassword = require('./services/forgot_password')
  , userCollection = require('./services/user')
  , Plugin = require('./plugin')
  , configure = require('./configure')
  , FB = require('./social/fb')
  , Twitter = require('./social/twitter')
  , allow = require('./middleware/allow_middleware')
  , faker = require('./faker')
  , hash = require('./helpers/hash')

  , mu = require('mustache')
  , _ = require('lodash')
  , bogart = require('bogart-edge')
  , uuid = require('node-uuid').v4
  , Promise = require('bluebird')
  , inflection = require('inflection')
  , mandrill = require('mandrill-api/mandrill')
  , path = require('path')
  , fs = require('fs');

function Summit (userConfig) {
  var viewDir = path.join(Summit.maindir(), 'views');

  this.config = configure(userConfig);
  this.env = this.config.environment;
  this.app = bogart.app();

  this.collections = {};
  this.controllers = {};
  this.templateGlobals = {};
  this.plugins = {};
  this.viewDirs = [viewDir];
  this.routers = [];
  this.middlewares = [];

  // Base injections
  this.injector = this.app.injector;
  this.inject('app', this);
  this.inject('env', this.env);
  this.inject('config', this.config);
  this.inject('_', _);
  this.inject('uuid', uuid);
  this.inject('mu', mu);

  // Service injections
  this.db = this.invoke(databaseProvider);
  this.inject('db', this.db);

  this.search = this.invoke(searchProvider);
  this.inject('Search', this.search);

  this.inject('User', userCollection(this));
  this.inject('Mandrill', new mandrill.Mandrill(this.config.mandrill.apiKey));
  this.inject('Faker', faker);
  this.inject('Timer', Timer);

  if (this.config.facebook) {
    this.fb = new FB(this.config.facebook);
    this.inject('FB', this.fb); // For legacy compat - changed for consistency
    this.inject('Facebook', this.fb);
  }

  if (this.config.twitter) {
    this.twitter = new Twitter(this.config.twitter);
    this.inject('Twitter', this.twitter);
  }

  this._middleware = middleware(this);
  this.use(this._middleware.error());
  this.use(this._middleware.parted());
  this.use(this._middleware.flash());
  this.use(this._middleware.methodOverride());
  this.use(this._middleware.session({secret: this.env.sessionSecret, lifetime: this.env.sessionLifetime}));
  this.use(this._middleware.bodyAdapter);

  this.use(function (req, next) {
    req.env = _.extend({}, req.env);
    return next();
  });

  this.use(function (req, injector, next) {
    // Allow middleware to inject locals
    injector.value('locals', {});

    // Allow middleware to modify the response
    injector.value('res', {
      status: null,
      headers: {},
      body: []
    });

    return Promise.resolve(next())
    .then(function (resp) {
      return injector.invoke(function (res) {
        return _.merge({}, res, resp);
      });
    });
  });

  this.use(this._middleware.user);
  this.use(this._middleware.defaultLocals);

  mailer(this);
  forgotPassword(this);
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

Summit.prototype.middleware = function (m) {
  this.middlewares.push(m);
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

Summit.prototype.controller = function (c) {
  var controller = this.invoke(c);
  this.controllers[controller.name] = controller;
  this.inject(controller.name + 'Controller', controller);
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

Summit.prototype.invoke = function (fn, thisArg, locals) {
  return this.app.injector.invoke.call(this.app.injector, fn, thisArg, locals);
};

Summit.prototype.plugin = function (pluginData) {
  var plugin = new Plugin(this, pluginData);

  plugin.collections = plugin.registerCollections();

  this.inject(plugin.name, plugin.injectable());
  this.plugins[plugin.name] = plugin;
  this.viewDirs.push(plugin.viewDir);
};

Summit.prototype.start = function (env) {
  var self = this;
  var env = _.extend({}, this.env, env);
  art();

  return (function () {
    if (env.skipSetup === true) {
      return Promise.resolve(true);
    }
    return self._setup()
  })()
  .then(function () {
    if (env.ssl) {
      return self._startWithSSL(env);
    }
    else {
      self.app.start(env.port);
    }
  })
  .catch(function (err) {
    console.log('FAILED TO START APP');
    console.log(err, err.stack);
  });
};

Summit.prototype._setup = function () {
  var self = this;
  var defaultViewDir = path.join(__dirname, '..', 'views');

  this.viewDirs.push(defaultViewDir);

  // `middlewares` vs `routers` is an important
  // distinction from an API perspective.

  // If a user wants to include middleware that's
  // not conceptually a router, but they want
  // to render a view (say, unauthorized) they'd
  // normally have to push it onto the router array
  // themselves so it gets used in the proper order.

  // This is clunky and bad, so we provide a
  // `middlewares` array for users to manipulate
  // via `app.middleware()` for clarity.

  this.middlewares.forEach(function (m) {
    self.use(m);
  });

  var hbsMiddleware = hbs(this.viewDirs)
  .onCreateLocals(function (app, locals) {
    return _.extend({}, app.templateGlobals, locals);
  });

  this.use(hbsMiddleware);

  this.routers.forEach(function (r) {
    self.use(r);
  });

  _.values(this.plugins).forEach(function (p) {
    // Apply plugin routes
    var router = self.invoke(p.router);
    self.use(router);
  });

  this.use(this._middleware.forgot_password);
  this.use(this._middleware.attachments);
  this.use(this._middleware.directory(path.join(bogart.maindir(), 'assets')));
  this.use(this._middleware.directory(path.join(__dirname, 'cms/assets')));
  this.use(this._middleware.directory(path.join(__dirname, '..', 'assets')));
  this.use(this._middleware.not_found);


  if (this.config.trustDb === true) {
    console.log('Trusting the database to be correct.  I hope you know what you\'re doing...');
    return new Promise.resolve(true);
  }

  // Make sure database exists
  return this.db.createDb(this.config.db.name)
  .then(function () {
    // Call collection setup methods
    return _.keys(self.collections)
    .map(function (c) {
      return self.collections[c].setup()
      .catch(function (err) {
        console.log(err);
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

Summit.prototype._startWithSSL = function (env) {
  var keyFileContents = fs.readFileSync(env.ssl.key, "utf-8");
  var certFileContents = fs.readFileSync(env.ssl.cert, "utf-8");

  var ssl = _.extend(env.ssl, {key: keyFileContents, cert: certFileContents});
  env.ssl = ssl;

  var sslOptions = _.extend(_.clone(env), {port: env.ssl.port});
  this.app.start(sslOptions);

  if (env.ssl.forceSsl) {
    var redirector = bogart.app();
    var rRouter = bogart.router();

    rRouter.get(/(.*)/, function(req){
      var port = env.ssl.port === 443 ? "" : ":" + env.ssl.port;
      return bogart.redirect("https://" + req.host + port + req.params.splat[0])
    });

    redirector.use(rRouter)
    redirector.start(env.port)
  }
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
  Summit.allow = allow;
  Summit.hash = hash;
  Summit.pipe = function (stream) {
    var res = bogart.res();
    stream.pipe(res);
    return res;
  }
  Summit.timer = Timer;

  Summit.middleware = middleware(null);

  return Summit;
};

function art () {
  function ascii () {
/*
          |>
         /*\
        /***\
       /*****\
      / ^ ^ ^ \
     / ^  ^  ^ \
   /\ ^ ^/\ ^ ^ /\
  /  \  /  \/\ /  \
 /    \/    \ \    \

       Summit
*/}

  var text = ascii.toString()
  .replace('function ascii() {\n', '')
  .replace('/*', '')
  .replace('*/', '')
  .replace('}', '');

  console.log(text);
}