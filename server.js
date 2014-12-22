var Summit = require('./app');

var app = new Summit();
var router = app.router();

app.multitenant = true;
app.collections.User.restful = true;

router.get('/', function () {
  return Summit.text('Hello, world!');
});

router.get('/user', function (req, User) {
  return User.findByEmail(req.params.email)
  .then(Summit.json);
});

router.get('/user/new', function (User, uuid) {
  return User.register({
    email: uuid(),
    password: uuid(),
    firstName: 'Joe',
    lastName: 'Schmoe',
    username: uuid()
  })
  .then(Summit.json);
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