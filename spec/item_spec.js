var Item = require('../lib/item')
  , Promise = require('bluebird');


describe('The Item class', function () {

  describe('has a constructor, which', function () {
    var item, itemWithId;
    
    beforeEach(function () {
      var coll = {name: 'Foo'};

      item = new Item({foo: 'bar'}, coll);
      itemWithId = new Item({foo: 'bar', _id: 'baz'}, coll);
    });

    it('should assign an id to item if one is not defined', function () {
      expect(item._id).toEqual(jasmine.any(String));
    });

    it('should not assign an id if one is defined', function () {
      expect(itemWithId._id).toEqual('baz');
    })

    it('should assign a collection name', function () {
      expect(item.collection).toEqual('Foo');
    });

    it('should assign the passed-in data\'s fields to itself', function () {
      expect(item.foo).toEqual('bar');
    });
  });

  describe('has a method called raw, which', function () {
    var raw;
    beforeEach(function () {
      var item = new Item({foo: 'bar'}, {name: 'Foo'});
      raw = item.raw();
    });

    it('should return the item\'s data', function () {
      expect(raw.foo).toEqual('bar');
    });

    it('should not include internal fields', function () {
      expect(raw._collection).toBeUndefined();
      expect(raw.save).toBeUndefined();
      expect(raw.raw).toBeUndefined();
    });
  });

  describe('has a method called save, which', function () {
    var results;
    var coll = {
      name: 'Foo',
      db: {
        put: null
      }
    };

    beforeEach(function () {
      var item = new Item({foo: 'bar'}, coll);
      
      spyOn(coll.db, 'put').andReturn(Promise.resolve(null));

      results = item.save();
    });

    it('should return a promise', function () {
      expect(results).toEqual(jasmine.any(Promise));
    });

    it('should save itself to the db', function () {
      var doc = {
        _id: jasmine.any(String),
        foo: 'bar',
        collection: 'Foo'
      };

      expect(coll.db.put).toHaveBeenCalledWith(doc);
    });

  });
});