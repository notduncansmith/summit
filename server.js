var Summit = require('./app');

var dbConfig = {
  name: 'summit',
  host: 'localhost',
  port: 5984
};

var app = new Summit();
var router = app.router();

router.get('/used', function (req) {
  return Summit.cors({from: 'used'});
});

router.get('/api/post/:id', function (Post) {
  return Post.get(req.params.id)
  .then(function (post) {
    return Summit.json(post);
  });
});

app.router(true)
.get('/', function () {
  return Summit.text('Hello, world!');
});

app.router(true).get('/:name', function (req) {
  var message = 'Hello ' + req.params.name;
  return Summit.json({message: message});
});

app.start();