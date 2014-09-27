var cheerio = require('cheerio')
  , pretty = require('js-beautify').html
  , inflection = require('inflection');
  
module.exports = makeForm;

function makeForm (coll, opts) {
  var formString = '';
  
  for (var f in coll.fields) {
    formString += getInput(f, coll.fields[f]);
  }

  if (opts && opts.values) {
    formString = addValues(formString, values);
  }

  return pretty(formString, {indent_size: 2, preserve_newlines: true});
}

function getInput (name, type) {
  var base = '<div class="form-group">'
    , $ = cheerio.load(base);

  switch (type) {
    case 'email':
      addString($, name, 'email', 'joe@schmoe.com');
      break;
    case 'number':
      addString($, name, 'number');
      break;
    case 'phone':
      addString($, name, 'email', '555-555-5555');
      break;
    case 'password':
      addString($, name, 'password', '••••••');
      break;
    case 'hidden':
      addString($, name, 'hidden');
      break;
    case 'bool':
      addBool($, name);
      break;
    case 'text':
      addText($, name);
      break;
    case 'upload':
      addUpload($, name);
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

function addString ($, name, type, placeholder) {
  $('.form-group').append('<label></label><input type="text" />');
  var input = $('input')
    , label = $('label')
    , title = inflection.titleize(inflection.underscore(name));
  
  input
    .attr('name', inflection.dasherize(name))
    .attr('placeholder', placeholder || title)
    .addClass('form-control');

  if (type) {
    input
    .attr('type', type);
  }

  label
    .text(title)
    .attr('for', inflection.dasherize(name));

  if (type && type === 'hidden') {
    label.remove();
  }
}

function addUpload ($, name) {
  // Yes, I'm aware that addUpload could simply be
  // addString() with "file" type.
  // However, that wouldn't be the most clear
  // and we'll probably want to do some file-specific
  // stuff later anyways.

  $('.form-group').append('<label></label><input type="file" />');

  var input = $('input')
    , label = $('label')
    , title = inflection.titleize(inflection.underscore(name));
  
  input
    .attr('name', inflection.dasherize(name))
    .addClass('form-control');

  label
    .text(title)
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

function addValues (formString, values) {
  var $ = cheerio.load(formString);

  $('input,textarea').each(function (i, el) {
    var key = $(el).attr('name');

    if ($(el).attr('type') === 'checkbox')
      $(el).prop('checked', opts.values[key]);
    else
      $(el).val(opts.values[key]);
  });
  
  return $.html();
}