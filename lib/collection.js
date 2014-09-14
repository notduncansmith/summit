function Collection (db) {
  this.db = db.use('items');
  this.collection = collection;
}

function get (idOrSlug) {
  // this.db.get()
Collection.prototype.get = function (id) {
  return this.db.get(id);
}

Collection.prototype.searchFor = function (terms) {
  
}

Collection.prototype.all = function () {
  return this.db.allDocs();
}

Collection.prototype.pages = function (page, opts) {

}

Collection.prototype.put = function (id, obj) {
  return this.db.put(id, obj);
}

}