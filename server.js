var Summit = require('./app');

var dbConfig = {
  name: 'summit',
  host: 'localhost',
  port: 5984
};

var app = new Summit();

var useRouter = app.router().get('/used', function (req) {
  return Summit.cors({from: 'used'});
});

app.router(true)
.get('/', function () {
  return Summit.text('Hello, world!');
});

app.use(useRouter);

app.router(true).get('/:name', function (req) {
  var message = 'Hello ' + req.params.name;
  return Summit.json({message: message});
});

app.start();