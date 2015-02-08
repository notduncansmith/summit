var levelDown = require('pouchdb/node_modules/leveldown')
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

  dbApp.use(require('express-pouchdb')(LevelPouch));

  db.listen = function () {
    dbApp.listen(port);
    console.log('PouchDB listening on port ' + port);
  };

  return db;
}