var _ = require('lodash');

module.exports = function () {
  // Pass an array or variadic number of arguments
  var groups = _.flatten([].slice.call(arguments));

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

    var allowed = groups.some(function (group) {
      return (user.groups.indexOf(group) >= 0);
    });

    if (allowed) {
      return next();
    }
    else {
      return response;
    }
  };
};