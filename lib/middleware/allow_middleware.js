var _ = require('lodash');

module.exports = function () {
  // Pass an array or variadic number of arguments
  var tags = _.flatten([].slice.call(arguments));

  return function (user, next, respond, views) {
    var response = {
      status: 401,
      body: ['You are not authorized to view this page']
    };

    if (views.unauthorized) {
      response = respond(views.unauthorized);
    }

    if (!user) {
      return response;
    }

    var allowed = tags.some(function (tag) {
      return (user.tags.indexOf(tag) >= 0);
    });

    if (allowed) {
      return next();
    }
    else {
      return response;
    }
  };
};