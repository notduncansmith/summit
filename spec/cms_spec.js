var db = {}
  , CMS = require('../lib/cms')
  , Cms = new CMS({});

describe('The CMS module', function () {
  
  describe('Has a method called collection, which', function () {
    var doc = {name:'foo', foo: 'bar'}
      , docName = 'foo'
      , result = null;

    beforeEach(function () {
      Cms.collection(doc);
      result = Cms.collection(docName);
    });

    it('when passed an object, should create a collection with the given name', function () {
      expect(Cms.collections.foo.collection.name).toEqual('foo');
    });

    it('when passed a string, should get a collection by name', function () {
      expect(result.collection.name).toEqual('foo');
    });
  });
});
