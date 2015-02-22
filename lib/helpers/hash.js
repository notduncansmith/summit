var crypto = require('crypto');

module.exports = function (str, fn, encoding) {
  var hash = crypto.createHash(fn || 'sha256');
  hash.update(str);
  return hash.digest(encoding || 'utf8');
}