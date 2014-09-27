var Promise = require('bluebird')
  , mime = require('mime')
  , path = require('path');

module.exports = {
  ensureDesignDoc: ensureDesignDoc,
  getContentType: getContentType
};

function ensureDesignDoc (db, name, ddoc) {
  return db.get(ddoc._id)
  .then(function (doc) {
    return Promise.resolve(doc);
  })
  .catch(function (err) {
    return db.put(ddoc._id, ddoc);
  });
}

function getContentType (filePath) {
  return mime.lookup(filePath);
}