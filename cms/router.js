var Summit = require('../app');

module.exports = function (app) {
  var router = app.router();

  router.get('/new-post', function (req, params, CMS) {
    var post = {
      title: req.params.title
    };

    return CMS.put(post)
    .then(function (result) {
      return Summit.json(results);
    });
  });

  router.get('/posts', function (req, views, respond, CMS) {
    return CMS.Post.all()
    .then(function (posts) {
      return respond(views.cms.post, {posts: posts});
    });
  });

  return router;
}