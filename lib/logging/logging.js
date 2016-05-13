var bunyan = require('bunyan')
  , nano = require('nano');

module.exports = function (app) {
  var config = app.config;
  var appName = app.name || "summit";

  config.logging = config.logging || {name:appName};
  config.logging.streams = config.logging.streams || [];

  config.logging.streams.push({
    level: "error",
    stream: {
      write: function (msg) {
        console.log(msg)
        var connString = (config.db.https ? "https" : "http")+"://"+config.db.auth+"@"+ config.db.host + ":" + config.db.port
        var client = nano(connString)
        var db = client.use(appName + "_log");
        db.insert(JSON.parse(msg), function (err, data){
          console.error("Failure to Couch log" , connString, err);
        }); 
      }
    }
  });
  

  return bunyan.createLogger(config.logging);
};
