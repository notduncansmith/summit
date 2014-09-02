var bogart = require('bogart-edge')
  , Database = require('../db')
  , _ = require('lodash')
  , config = require('../../config')
  , db = new Database(config.db)
  , CMS = require('../cms')
  , Cms = new CMS(config.db);

var collections = [
  {id: '1234', name: 'Things', isPostType: false},
  {id: '4567', name: 'Posts', isPostType: true},
];

var testApi = require('../api');

module.exports = function (router) {
  router.get('/collections', function (req, views, respond) {
    return respond(views.collections.list, {collections: collections});
  });

  router.post('/collection', function (req) {
    collections.push(req.params);
    return bogart.json(collections);
  });

  router.get('/collections/new', function (views, respond) {
    return Cms.collection('Post')
    .then(function (output) {
      return bogart.json(output);
    });
  });
};