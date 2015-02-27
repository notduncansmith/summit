var Promise = require('bluebird');

module.exports = function (res, next) {
  res.headers['Access-Control-Allow-Origin'] = '*';
  res.headers['Access-Control-Allow-Credentials'] = true;
  res.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,HEAD';
  res.headers['Access-Control-Allow-Headers'] = 'accept, authorization, content-type, origin, referer, x-csrf-token, Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With, *';

  return next();
}