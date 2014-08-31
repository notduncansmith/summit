var bogart = require('bogart-edge');
var collections = [
  {id: '1234', name: 'Things', isPostType: false},
  {id: '4567', name: 'Posts', isPostType: true},
];

module.exports = function (router) {
  router.get('/collections', function (req, views, respond) {
    return respond(views.collections.list, {collections: collections});
  });

  router.post('/collection', function (req) {
    collections.push(req.params);
    return bogart.json(collections);
  });

  router.get('/collections/new', function (views, respond) {
    return respond(views.collections.new);
  });
};