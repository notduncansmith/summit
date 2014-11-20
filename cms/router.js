var Summit = require('../app');

module.exports = function (app) {
  var router = app.router();

  router.get('/new-post', function (req, Post) {
    var post = {
      title: req.params.title
    };

    return Post.put(post)
    .then(function (result) {
      return Summit.json(result);
    });
  });

  router.get('/posts', function (req, views, respond, Post) {
    return Post.all()
    .then(function (posts) {
      return respond(views.post, {posts: posts});
    });
  });

  return router;
}