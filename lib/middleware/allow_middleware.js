var _ = require('lodash')
   , Promise = require('bluebird');

var defaultRejection = {
  status: 401,
  body: ['You are not authorized to view this page']
};

module.exports = function () {
  // Pass an array or variadic number of arguments
  var tags = _.flatten([].slice.call(arguments));

  return function (user, next, respond, views) {
    var response = defaultRejection;
    var allowAnon = tags.indexOf('*') >= 0;

    if (views.unauthorized) {
      response = respond(views.unauthorized);
    }

    if (!user && !allowAnon) {
      return response;
    }

    if (match(user, tags)) {
      return next();
    }
    else {
      return response;
    }
  };
};

function match (user, tags) {
  var userTags = user.tags || [];

  return tags.some(function (tag) {
    if (typeof tag === 'string') {
      return (userTags.indexOf(tag) >= 0) || user[tag];
    }
    else {
      // Tag must be a synchronous function
      return tag(user);
    }
  })
}