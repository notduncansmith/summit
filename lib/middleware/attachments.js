var bogart = require('bogart-edge');

module.exports = function attachments (app) {
  var router = app.router(false);

  router.get('/attachment/:docId/:attId', function (req) {
    var att;

    return app.db.get(req.params.docId)
    .then(function (doc) {
      doc = doc[0];
      att = doc._attachments[req.params.attId];
      return app.db.getAttachment(doc._id, req.params.attId);
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

  router.post('/attachment/:docId/:attId/delete', function (req) {
    return app.db.detach(req.params.docId, req.params.attId)
    .then(function (results) {
      return bogart.json(results);
    });
  });

  return router;
};