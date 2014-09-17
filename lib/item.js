var inflection = require('inflection')
  , uuid = require('node-uuid')
  , _ = require('lodash');

module.exports = Item;

function Item (data, coll) {
  this._collection = coll;
  
  if (!data._id) {
    data._id = uuid.v4();
  }

  data.collection = coll.collection.name;

  for (var d in data) {
    this[d] = data[d];
  }
}

Item.prototype.save = function () {
  var self = this;
  return this._collection.db.put(this.raw())
  .then(function () {
    return self;
  });
};

Item.prototype.raw = function () {
  var omitted = [
    'save', 
    'raw',
    '_collection'
  ];
  
  return _.omit(this, omitted);
};