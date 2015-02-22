var inflection = require('inflection')
  , _ = require('lodash')
  , util = require('../util');

module.exports = {
  designDoc: designDoc,
  mergeDesignDocs: mergeDesignDocs,
  fileSafeName: fileSafeName,
  dbSafeName: dbSafeName,
  routeSafeName: routeSafeName
};

function fileSafeName (name) {
  var name = name
  .replace('$GET', '')
  .replace('$POST', '');

  return inflection.underscore(name);
}

function dbSafeName (name) {
  return inflection.classify(name);
}

function routeSafeName (methodName) {
  var methodName = methodName
  .replace('$GET', '')
  .replace('$POST', '');

  return inflection.dasherize(methodName).toLowerCase();
}

function mergeDesignDocs (one, two) {
  var newOneDoc = _.extend({}, one);
  var newTwoDoc = _.extend({}, two);
  return _.merge(newOneDoc, newTwoDoc);
}

function designDoc (collection) {
  var name = dbSafeName(collection.name);

  var newDesignDoc = {
    _id: '_design/' + name
  };

  var stringified = _.mapValues(collection.design, function (e) {
    return util.stringifyFunctions(e, collection);
  });

  return _.extend({}, newDesignDoc, stringified);
}