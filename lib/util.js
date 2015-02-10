var mime = require('mime')
  , _ = require('lodash')
  , mu = require('mustache')
  , path = require('path')
  , Promise = require('bluebird')
  , fs = Promise.promisifyAll(require('fs'));

module.exports = {
  ensureDesignDoc: ensureDesignDoc,
  getContentType: getContentType,
  stringifyFunctions: stringifyFunctions,
  getArguments: getArguments,
  getFileForAttachment: getFileForAttachment
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

function getArguments (fn) {
  var argumentsRegExp = /\(([\s\S]*?)\)/;
  var replaceRegExp = /[ ,\n\r\t]+/;

  var fnArguments = argumentsRegExp.exec(fn)[1].trim();

  if (0 === fnArguments.length) {
    return [];
  }

  return fnArguments.split(replaceRegExp);
}

function getFileForAttachment (filePath) {
  if (typeof filePath !== 'string') {
    // must be a user-provided object
    // so just return it
    return filePath;
  }

  return fs.readFileAsync(filePath)
  .then(function (data) {
    return {
      data: data,
      content_type: getContentType(filePath),
      name: path.basename(filePath)
    };
  });
}