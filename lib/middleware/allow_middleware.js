var _ = require('lodash')
   , Promise = require('bluebird')
   , bogart = require('bogart-edge');

module.exports = function () {
  // Pass an array or variadic number of arguments
  var tags = _.flatten([].slice.call(arguments));

  return function (req, user, next) {
    var response = bogart.redirect('/unauthorized');
    var allowAnon = tags.indexOf('*') >= 0;

    if (req.pathInfo === '/unauthorized') {
      return next();
    }

    if (!user && !allowAnon) {
      return response;
    }

    return Promise.resolve(match(user, tags))
    .then(function (allowed) {
      if (allowed) {
        return next();
      }
      else {
        return response;
      }
    });
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