var Promise = require('bluebird')
  , mime = require('mime')
  , path = require('path')
  , _ = require('lodash')
  , mu = require('mustache');

module.exports = {
  ensureDesignDoc: ensureDesignDoc,
  getContentType: getContentType,
  stringifyFunctions: stringifyFunctions
};

function ensureDesignDoc (db, ddoc) {
  return db.put(ddoc._id, ddoc, true);
}

function getContentType (filePath) {
  return mime.lookup(filePath);
}

function stringifyFunctions (obj, data) {
  return _.mapValues(obj, function (v) {
    if (typeof v === 'function') {
      if (data) {
        return mu.render(v.toString(), data);
      }

      return v.toString();
    }

    return stringifyFunctions(v, data);
  });
}