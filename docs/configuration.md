#Configuration

##Default Options
Summit is ready to launch directly after download and comes configured with (what we think are) sane defaults. If you are interested in changing the default configuration, a listing of options is below.

### `environment`
* HOSTNAME: 'localhost'
* PORT: 1337
* PROTOCOL: 'http'
* URL: 'http://localhost:1337'
* DEVELOPMENT: true
* APPNAME: 'My Awesome App'

### `db`
* DBHOST: 'localhost'
* DBPORT: 5984
* DBNAME: 'summit'
* DBHTTPS: "false"
* DBAUTH: ''
* Search
  * DRIVER: 'pouch'
* ElasticSearch
  * ESHOST: 'localhost'
  * ESPORT: '9200'

### Mandrill
* MANDRILL_API_KEY: ''
* MANDRILL_FROM_EMAIL: ''
* MANDRILL_FROM_NAME: ''

### Facebook
* FB_CLIENT_ID: ''
* FB_CLIENT_SECRET: ''

### Google
* GOOGLE_CLIENT_ID: ''

##Changing Default Options
The default options can be changed in a number of ways.

For just a single session of change, simply list the options inline in the terminal with the starting node command. A simple example would be changing the port.

```
PORT='1338' node server.js
```

The application will now work when opening the browser to http://localhost:1338/ rather than http://localhost:1337/.

If you need more permanence in the changes being made, create a config.js file to reside alongside your app.js.

```
//config.js
module.exports = {
  environment: {
    host: 'localhost',
    port: 1337
  },

  db: {
    host: 'localhost',
    port: 5984,
    name: 'example'
  }
}
```

```
// app.js

var Summit = require('summit');
var config = require('./config'); //line which will look for your config.js file
var app = new Summit(config);

app.start();
```
The app will now be set to use the settings you defined in your config.js which will launch everytime your app.js launches.
