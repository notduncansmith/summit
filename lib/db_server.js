var levelDown = require('leveldown')
  , PouchDB = require('pouchdb')
  , express = require('express')
  , search = require('pouchdb-quick-search')
  , maindir = require('bogart-edge').maindir
  , path = require('path');

PouchDB.plugin(search);

var LevelPouch = PouchDB.defaults({db: levelDown, prefix: path.join(maindir(), '.pouch_')});

module.exports = function (config) {
  var dbApp = express()
    , db = new LevelPouch(config.db.name)
    , port = config.db.port;

  if (config.db.enableCORS) {
    console.log('Warning: using very permissive CORS headers.')
    dbApp.all('*', function(req, res, next) {
      res.header("Access-Control-Allow-Origin", config.environment.url);
      res.header("Access-Control-Allow-Headers", "accept, authorization, content-type, origin, referer, x-csrf-token, Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With, *");
      res.header('Access-Control-Allow-Credentials', true);
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,HEAD');

      if (req.method.toLowerCase() === 'options') {
        res.sendStatus(204);
      }
      else {
        next();
      }
    });
  }

  dbApp.use(require('express-pouchdb')(LevelPouch));

  db.listen = function () {
    dbApp.listen(port);
    console.log('PouchDB listening on port ' + port);
  };

  return db;
}