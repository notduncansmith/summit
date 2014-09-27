var Database = require('./db')
  , _ = require('lodash')
  , Collection = require('./collection')
  , bogart = require('bogart-edge');

module.exports = Cms;

function Cms (config) {
  this.config = config;
  this.db = new Database(config);
  this.collections = {};
  
  this.middleware = {
    attachments: attachments.bind(this)
  };
}

Cms.prototype.collection = function(c) {
  if (typeof c === 'string') {
    return this.collections[c];
  }

  var coll = new Collection(c, this.db);
  
  this.collections[c.name] = coll;

  return coll;
};

function attachments () {
  var router = bogart.router()
    , self = this
    , config = this.config;

  router.get('/attachment/:docId/:attId', function (req) {
    var att;

    return self.db.get(req.params.docId)
    .then(function (doc) {
      doc = doc[0];
      att = doc._attachments[req.params.attId];
      return self.db.getAttachment(doc._id, req.params.attId)
    })
    .then(function (buf) {
      return {
        status: 200,
        headers: {
          'Content-Length': att.length,
          'Content-Type': att.content_type
        },
        body: [buf]
      };
    });
  });

  return router;
}


function uploadCollection () {
  var coll = {
    name: 'Upload',
    isUploadType: true,
    fields: {
      path: 'string'
    }
  };

  return coll;
}