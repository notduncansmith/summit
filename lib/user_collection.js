module.exports = function (app) {
  return app.collection({
    name: 'User',
    isUserType: true
  });
};