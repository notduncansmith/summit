var _ = require('lodash')
  , Summit = require('../app')
  , path = require('path');

module.exports = Plugin;

function Plugin (app, pluginData) {
  var viewDir = path.join(bogart.maindir(), 'node_modules', 'summit-plugin-' + pluginData.name, 'views');

  var defaults = {
    name: Summit.uuid(),
    collections: [],
    router: function(){},
    services: {},
    viewDir: viewDir
  };

  var data = _.defaults(defaults, pluginData);

  this.app = app;
  _.extend(this, data);
}

Plugin.prototype.registerCollections = function () {
  var app = this.app;

  return this.collections.map(function (c) {
    return app.collection(c);
  });
};

Plugin.prototype.injectable = function () {
  var plugin = {
    name: this.name,
    viewDir: this.viewDir
  };

  _.extend(plugin, this.services);
  _.extend(plugin, this.collections);
  
  return plugin;
};