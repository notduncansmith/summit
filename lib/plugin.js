var uuid = require('uuid').v4
  , bogart = require('bogart-edge')
  , path = require('path')
  , _ = require('lodash');

module.exports = Plugin;

function Plugin (app, pluginData) {
  var viewDir = path.join(bogart.maindir(), 'node_modules', 'summit-plugin-' + pluginData.name, 'views');

  var defaults = {
    app: app,
    name: uuid(),
    collections: [],
    router: function(){},
    services: {},
    viewDir: viewDir
  };

  var data = _.defaults(pluginData, defaults);

  _.extend(this, data);
}

Plugin.prototype.registerCollections = function () {
  var app = this.app;
  return this.collections.map(app.invoke.bind(app));
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