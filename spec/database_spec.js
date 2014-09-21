var Database = require('../lib/db')
  , db = new Database({host: 'localhost', port: '5384', name: 'test'})
  , Promise = require('bluebird');

describe('The database wrapper', function () {
  it('should offer a method called get', function () {
    expect(db.get).toEqual(jasmine.any(Function));
    
    describe('The get method', function () {
      var getResults;

      beforeEach(function () {
        spyOn(db.db, 'get').andCallThrough();
        getResult = db.get('foo');
      });
      
      it('should fetch a doc from the database', function () {
        expect(db.db.get).toHaveBeenCalledWith('foo', jasmine.any(Function));
      });

      it('should return a promise', function () {
        expect(getResult).toEqual(jasmine.any(Promise));
      });
    });
  });

  it('should offer a method called put', function () {
    expect(db.put).toEqual(jasmine.any(Function));


    describe('The put method', function () {
      var testDoc = {
        foo: 'bar'
      };
      var testDocName = 'bar'
        , putResults;

      beforeEach(function () {
        spyOn(db.db, 'insert').andCallThrough();
        putResults = db.put(testDocName, testDoc);
      });
      
      it('should insert a doc with the given name into the database', function () {
        expect(db.db.insert).toHaveBeenCalledWith(testDoc, testDocName, jasmine.any(Function));
      });

      it('should return a promise', function () {
        expect(putResults).toEqual(jasmine.any(Promise));
      });
    });
  });


  it('should offer a method called use', function () {
    expect(db.use).toEqual(jasmine.any(Function));

    describe('The use method', function () {
      var newDb
        , newName = 'bar';

      beforeEach(function () {
        newDb = db.use(newName);
      });

      it('should return a new Database object', function () {
        expect(newDb).toEqual(jasmine.any(Database));
      });

      it('should be configured to use the specified name', function () {
        expect(newDb.config.name).toEqual(newName);
      });
    });
  });

  it('should offer a method called view', function () {
    expect(db.view).toEqual(jasmine.any(Function));

    describe('The view method', function () {
      var viewResult;

      beforeEach(function () {
        spyOn(db.db, 'view');
        viewResult = db.view('foo', 'bar');
      });

      it('should return a promise', function () {
        expect(viewResult).toEqual(jasmine.any(Promise));
      });

      it('should ask nano for the view', function () {
        expect(db.db.view).toHaveBeenCalledWith('foo', 'bar', jasmine.any(Function));
      });
    });
  });
});
