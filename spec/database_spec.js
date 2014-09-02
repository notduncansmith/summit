var Database = require('../lib/db')
  , db = new Database({host: 'localtest', port: '1234', name: 'test'});

describe('The database wrapper', function () {
  it('should offer a method called get', function () {
    expect(db.get).toEqual(jasmine.any(Function));
    
    describe('The get method', function () {
      beforeEach(function () {
        spyOn(db.db, 'get').andCallThrough();
        db.get('foo');
      });
      
      it('should fetch a doc from the database', function () {
        expect(db.db.get).toHaveBeenCalledWith('foo');
      });

      it('should return a promise', function () {
        expect(db.get().then).toEqual(jasmine.any(Function));
      });
    });
  });

  it('should offer a method called put', function () {
    expect(db.put).toEqual(jasmine.any(Function));


    describe('The put method', function () {
      var testDoc = {
        foo: 'bar'
      };
      var testDocName = 'bar';

      beforeEach(function () {
        spyOn(db.db, 'insert').andCallThrough();
        db.put(testDocName, testDoc);
      });
      
      it('should insert a doc with the given name into the database', function () {
        expect(db.db.insert).toHaveBeenCalledWith(testDoc, testDocName);
      });

      it('should return a promise', function () {
        expect(db.put().then).toEqual(jasmine.any(Function));
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
});
