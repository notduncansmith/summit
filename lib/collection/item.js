var uuid = require('node-uuid')
  , _ = require('lodash')
  , path = require('path')
  , moment = require('moment');

module.exports = Item;

function Item (data, coll) {
  this._collection = coll;

  if (!data._id) {
    data._id = uuid.v4();
  }

  if (typeof data._attachments === 'string') {
    data._attachments = JSON.parse(data._attachments);
  }

  if (!data.collection) {
    data.collection = coll.name;
  }

  data.type = data.collection;

  _.extend(this, data);
}

Item.prototype.save = function () {
  var self = this
    , fields = this._collection.fields
    , uploadFields
    , attachmentPaths;

  if (this._collection.timestamps) {
    if (!this._rev) {
      this.createdAt = moment().toISOString();
    }
    this.updatedAt = moment().toISOString();
  }

  if (this._collection.isUserType) {
    this.isUser = true;
  }

  uploadFields = Object.getOwnPropertyNames(fields)
  .filter(function (key) {
    return (fields[key] === 'upload' && self[key]);
  });

  attachmentPaths = getAttachmentPaths(self, uploadFields);

  uploadFields.forEach(function (key) {
    var filePath = self[key];
    self[key] = getUploadObject(self, filePath);
  });

  if (attachmentPaths.length === 0) {
    return this._collection.db.put(this._id, this.raw());
  }

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