var Collection = require('../lib/collection')
  , Promise = require('bluebird')
  , fakeDb = {
    use: function () {return fakeDb},
    get: function () {return new Promise.resolve(null)},
    put: function () {return new Promise.resolve(null)}
  }
  , Coll = new Collection({
    name: 'Foo',
    fields: {
      title: 'string',
      body: 'text',
      md: 'markdown',
      phone: 'phone',
      email: 'email',
      num: 'number',
      cb: 'bool'
    }
  }, fakeDb);

describe('A Collection', function () {

  describe('has a method called form, which', function () {
    var form = null;

    beforeEach(function () {
      form = Coll.form();
      console.log(form)
    });

    it('returns a string', function () {
      expect(form).toEqual(jasmine.any(String));
    });
  });

  describe('has a method called setup, which', function () {

    it('checks to see if the design doc exists', function (done) {
      spyOn(fakeDb, 'get').andCallThrough();

      Coll.setup()
      .then(function () {
       expect(fakeDb.get).toHaveBeenCalledWith('_design/cms-Foo');
       done();
      });
    });

    it('creates the database if the design doc does not exist', function (done) {
      var newDoc = {
        _id: "_design/cms-Foo",
        views: {
          all: "function (doc) { if (doc.collection == 'Foo') { emit(doc.id, doc); } }"
        }
      };

      spyOn(fakeDb, 'get').andCallFake(function () {
        return new Promise.reject(null);
      });

      spyOn(fakeDb, 'put').andCallFake(console.log);

      Coll.setup()
      .then(function () {
       expect(fakeDb.put).toHaveBeenCalledWith('_design/cms-Foo', JSON.stringify(newDoc));
       done();
      });
    });
  });
});
