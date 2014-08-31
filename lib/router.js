var bogart = require('bogart-edge');
var router = bogart.router();
var routers = {
  collection: require('./routers/collection')
};

module.exports = function() {
  routers.collection(router);
  return router;
};