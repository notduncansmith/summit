var inflection = require('inflection')
  , uuid = require('node-uuid')
  , _ = require('lodash')
  , util = require('./util')
  , path = require('path')
  , Promise = require('bluebird');

module.exports = Item;

function Item (data, coll) {
  this._collection = coll;
  
  if (!data._id) {
    data._id = uuid.v4();
  }

  data.collection = coll.collection.name;

  _.extend(this, data);
}

Item.prototype.save = function () {
  var self = this
    , fields = this._collection.collection.fields;

  var uploadFields = Object.getOwnPropertyNames(fields)
  .filter(function (key) {
    return (fields[key] === 'upload' && self[key])
  });

  var attachmentPaths = getAttachmentPaths(self, uploadFields);
  console.log('Extracted attachment paths: ', attachmentPaths);

  uploadFields.forEach(function (key) {
    var filePaths = self[key];
    self[key] = getUploadObject(self, filePaths);
  });

  console.log('Item to store: ', self);

  return this._collection.db.put(this.raw())
  .then(function (results) {
    return self.attach(attachmentPaths);
  })
  .then(function (results) {
    return self._collection.get(self._id);
  });
};

Item.prototype.attach = function (filePaths) {
  var self = this;

  var paths = filePaths.filter(function (p) {
    return (!self.attachments || !self._attachments[p]);
  });

  return this._collection.db.attach(this._id, filePaths);
};

Item.prototype.raw = function () {
  var omitted = [
    'save', 
    'raw',
    '_collection',
    'attach'
  ];
  
  return _.omit(this, omitted);
};

function getUploadObject (item, filePaths) {
  var attId, permalink, deleteLink;

  if (_.isArray(filePaths)) {
    return filePaths.map(getUploadObject.bind(null, item));
  }

  attId = path.basename(filePaths);
  permalink = '/attachment/' + item._id + '/' + attId;
  deleteLink = permalink + '/delete';

  return {
    attachmentId: attId,
    permalink: permalink,
    deleteLink: deleteLink
  };
}

function getAttachmentPaths (item, uploadFields) {
  var attachmentPaths = uploadFields.map(function (f) {
    return item[f];
  });

  return _.flatten(attachmentPaths);
}