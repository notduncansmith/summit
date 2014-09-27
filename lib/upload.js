var Collection = require('./collection')
  , bcrypt = require('bcrypt')
  , Item = require('./item')
  , _ = require('lodash')
  , Promise = require('bluebird');

module.exports = UploadCollection;

function UploadCollection () {

}

UploadCollection.prototype.put = function(filePath) {
  var self = this;
  var item = new Item({path: filePath}, self);

  return item.save()
  .then(function (item) {
    console.log(item.path);
    return self.db.attach(item._id, item.path);
  }); 
};