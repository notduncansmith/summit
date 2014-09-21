var Promise = require('bluebird');

module.exports = {
  ensureDesignDoc: ensureDesignDoc
};

function ensureDesignDoc(db, name, ddoc) {
  return db.get(ddoc._id)
  .then(function (doc) {
    return Promise.resolve(doc);
  })
  .catch(function (err) {
    var doc = JSON.stringify(ddoc);
    return db.put(ddoc._id, doc);
  });
}