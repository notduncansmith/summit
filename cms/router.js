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
  router.get('/page', function (req, views, respond, Page){
    return respond(views.page, {page:{}});
  })
  router.get('/page/:id', function (req, Page, views, respond){
    return Page.get(req.params.id).then(function(page){
      return respond(views.page, {page:page});
    })
  })

  var savePage = function (req, uuid, _, Page){
    return Page.get(req.params.id).then(function(page){
      page = page._id ? page : {_id: uuid()};
      page = _.extend(page, req.params);
      return Page.put(page).then(function(result){
        return Summit.redirect('/pages')
      })   
    })
  }

  router.post('/page', savePage)
  router.post('/page/:id', savePage)


  router.get('/pages', function (Page, respond, views){
    return Page.all().then(function(result){
      return respond(views.pages, {pages:result})
    })
  })

  var savePost = function (req, uuid, _, Post){
    return Post.get(req.params.id).then(function(post){
      post = post._id ? post : {_id: uuid()};
      post = _.extend(post, req.params);
      return Post.put(post).then(function(result){
        return Summit.redirect('/posts')
      })   
    })
  }
  router.post('/post', savePost);
  router.post('/post/:id', savePost);
  router.get('/post/:id', function (req, Post, views, respond){
    return Post.get(req.params.id).then(function(post){
      return respond(views.post, {post:post})
    })
  })
  router.get('/post', function (req, views, respond){
    return respond(views.post, {post:{}})
  })
  router.get('/posts', function (req, views, respond, Post) {
    return Post.all()
    .then(function (posts) {
      return respond(views.posts, {posts: posts});
    });
  });

  //Serves all html content
  router.get(/.*/, function (req, Page, views, respond){
    return Page.view('bySlug', {key:req.pathInfo}).then(function (results){
      if (results.length ===0){
        return respond(views.not_found, {status:404});
      }
      return respond(views.view_page, results[0]);
    })
  })

  return router;
}