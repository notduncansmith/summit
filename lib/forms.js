var cheerio = require('cheerio')
  , pretty = require('js-beautify').html
  , inflection = require('inflection');
  
module.exports = makeForm;

function makeForm (coll) {
  var formString = '';
  
  for (var f in coll.fields) {
    formString += getInput(f, coll.fields[f]);
  }

  return pretty(formString, {indent_size: 2, preserve_newlines: true});
}

function getInput (name, type) {
  var base = '<div class="form-group">'
    , $ = cheerio.load(base);

  switch (type) {
    case 'email':
      addString($, name, 'email');
      break;
    case 'number':
      addString($, name, 'number');
      break;
    case 'phone':
      addString($, name, 'email');
      break;
    case 'bool':
      addBool($, name);
      break;
    case 'text':
      addText($, name);
      break;
    case 'markdown':
      addText($, name);
      break;
    default:
      addString($, name);
      break;
  }

  return $.html('.form-group') + '\n\n';
}

function addString ($, name, type) {
  $('.form-group').append('<label></label><input type="text" />');
  var input = $('input')
    , label = $('label');
  
  input
    .attr('name', inflection.dasherize(name))
    .addClass('form-control');

  if (type) {
    input.attr('type', type);
  }

  label
    .text(inflection.titleize(name))
    .attr('for', inflection.dasherize(name));
}

function addText ($, name) {
  $('.form-group').append('<label></label><textarea></textarea>');
  var ta = $('textarea')
    , label = $('label');
  
  ta
    .attr('name', inflection.dasherize(name))
    .addClass('form-control');

  label
    .text(inflection.titleize(name))
    .attr('for', inflection.dasherize(name));
}

function addBool ($, name) {
  $('.form-group').append('<label><input type="checkbox" /></label>');
  var input = $('input')
    , label = $('label');
  
  input
    .attr('name', inflection.dasherize(name))
    .addClass('form-control');

  label
    .text(inflection.titleize(name))
    .attr('for', inflection.dasherize(name));
}