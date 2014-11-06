var inflection = require('inflection');

module.exports = function (app) {
  return {
    slugify: slugify
  }
}

function slugify (title) {
  var raw = inflection.underscore(title);
  return inflection.dasherize(raw);
}