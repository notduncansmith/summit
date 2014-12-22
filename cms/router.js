var Summit = require('../app')
  , moment = require('moment')
  , path = require('path');

module.exports = function (app) {
  var router = app.router();

  router.post('/page', savePage);
  router.post('/page/:id', savePage);
  router.post('/post', savePost);
  router.post('/post/:_id', savePost);

  router.get('/page', function (req, views, respond, Page){
    return respond(views.page, {page:{}});
  });

  router.get('/page/:id', function (req, Page, views, respond){
    return Page.get(req.params.id)
    .then(function (page) {
      page.createdAt = moment(page.createdAt).fromNow();
      page.updatedAt = moment(page.updatedAt).fromNow();

      return respond(views.page, {page:page});
    });
  });

  router.get('/pages', function (Page, respond, views){
    return Page.all()
    .then(function (result) {
      return respond(views.pages, {pages:result});
    });
  });

  router.get('/post/:_id', function (req, Post, views, respond){
    return Post.get(req.params._id)
    .then(function (post) {
      console.log(post);
      return respond(views.post, {post:post});
    });
  });

  router.get('/post', function (req, views, respond){
    return respond(views.post, {post:{}});
  });

  router.get('/posts', function (req, views, respond, Post) {
    return Post.all()
    .then(function (posts) {
      return respond(views.posts, {posts: posts});
    });
  });

  //Serves all html content
  router.get(/.*/, function (req, Page, Post, views, respond){
    var slug = req.pathInfo.slice(1);

    return Page.view('bySlug', {key: slug})
    .then(function (results) {
      if (results.length === 0) {
        return Post.view('bySlug', {key: slug})
        .then(function (results) {
          if (results.length === 0) {
            return respond(views.not_found, {}, {status:404});
          }

          return respond(views.view_post, results[0]);
        });
      }

      return respond(views.view_page, results[0]);
    });
  });

  function savePost (req, _, Post, app, uuid){
    return Post.get(req.params._id)
    .then(function (post) {

      post = post._id ? post : {_id: uuid()};
      var params = req.params;

      if (params.featureImg === '') {
        params = _.omit(params, ['featureImg']);
        post = _.extend(post, params);
      } else {
        post = _.extend(post, params);
        post.featureImg = path.basename(params.featureImg);
      }

      return Post.put(post)
      .then(function () {
        if (req.body.featureImg){
          return app.db.attach(post._id, req.body.featureImg)
          .then(function(){
            return Summit.redirect('/posts');
          });
        }

        return Summit.redirect('/posts');
      });
    });
  }

  function savePage (req, uuid, _, Page) {
    return Page.get(req.params._id)
    .then(function (page) {
      page = page._id ? page : {_id: uuid()};
      page = _.extend(page, req.params);

      return Page.put(page);
    })
    .then(function (result) {
      return Summit.redirect('/pages');
    });
  }

  return router;
};
