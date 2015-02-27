var Summit = require('./app');

var app = new Summit();
var router = app.router();

// var User = app.collection({
//   name: 'User',
//   restful: true,
//   fields: {}
// });

router.get('/', function () {
  return Summit.text('Hello, world!');
});

router.get('/:foo', function (req) {
  return Summit.text('Hello, ' + req.params.foo + '!');
});

// router.get('/user/new', function (User, respond, views) {
//   var form = User.form();
//   var locals = {form: form};

//   return respond(views.hello, locals);
// });

// router.post('/user/new', function (req, User, respond, views) {
//   var name = req.params.name;

//   return User.put({name: name})
//   .then(function (result) {
//     return Summit.json(result);
//   });
// });

app.start();