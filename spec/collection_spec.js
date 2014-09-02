var db = {}
  , CMS = require('../lib/cms')
  , Cms = new CMS({});

describe('The CMS module', function () {
  
  describe('Has a method called collection, which', function () {
    var doc = {name:'foo', foo: 'bar'}
      , docName = 'foo';

    beforeEach(function () {
      spyOn(Cms.collections, 'get');
      spyOn(Cms.collections, 'put');

      Cms.collection(docName);
      Cms.collection(doc);
    });

    it('when passed a string, should get a collection by name', function () {
      expect(Cms.collections.get).toHaveBeenCalledWith(docName);
    });

    it('when passed an object, should create a collection with the given name', function () {
      expect(Cms.collections.put).toHaveBeenCalledWith(docName, doc);
    });
  });
});
