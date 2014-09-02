function Collection (db) {
  this.db = db.use('items');
  this.get = get.bind(this);
}

function get (idOrSlug) {
  // this.db.get()
}