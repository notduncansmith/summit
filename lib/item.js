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

  if (typeof data._attachments === 'string') {
    data._attachments = JSON.parse(data._attachments);
  }

  data.collection = coll.collection.name;

  _.extend(this, data);
}

Item.prototype.save = function () {
  var self = this
    , fields = this._collection.collection.fields;

  console.log('Saving doc: ', self);

  var uploadFields = Object.getOwnPropertyNames(fields)
  .filter(function (key) {
    return (fields[key] === 'upload' && self[key])
  });

  console.log('Found upload fields: ', uploadFields);

  var attachmentPaths = getAttachmentPaths(self, uploadFields);
  console.log('Extracted attachment paths: ', attachmentPaths);

  uploadFields.forEach(function (key) {
    var filePath = self[key];
    self[key] = getUploadObject(self, filePath);
  });

  if (this._rev && _.isUndefined(this._attachments) && uploadFields.length > 0) {
    return this._collection.db.attach(this._id, attachmentPaths);
  }

  return this._collection.db.attach(this.raw(), attachmentPaths);
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

function getUploadObject (item, filePath) {
  var attId, permalink, deleteLink;

  if (_.isArray(filePath)) {
    return filePath.map(getUploadObject.bind(null, item));
  }

  if (typeof filePath !== 'string') {
    // must already be an upload object
    return filePath;
  }

  attId = path.basename(filePath);
  permalink = '/attachment/' + item._id + '/' + attId;
  deleteLink = permalink + '/delete';

  return {
    attachmentId: attId,
    permalink: permalink,
    deleteLink: deleteLink
  };
}

function getAttachmentPaths (item, uploadFields) {
  var attachmentPaths = uploadFields
  .map(function (f) {
    return item[f];
  });

  return _.flatten(attachmentPaths)
  .filter(function (p) {
    return (typeof p === 'string');
  });
}