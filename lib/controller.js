var _ = require('lodash');

module.exports = Controller;

function Controller (controller, app) {
  var self = this;

  this.app = app;
  this.controller = controller;
  this.name = controller.name;

  _.keys(controller).forEach(function (k) {
    var action = self.controller[k];

    if (k === 'name' || k === 'fetch') {
      return;
    }

    self[k] = function (injector) {
      console.log('Called action ' + k)
      return injector.invoke(action.bind(self));
    };
  });
}