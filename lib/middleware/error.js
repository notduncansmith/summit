// Mostly borrowed from Bogart

var q = require('bogart-edge').q
  , _ = require('lodash');

function errorResponse(config, req, err) {
  var message = '<h3>Message:</h3>';

  if (config.showError) {
    if (typeof err === 'string') {
      message += err;
    } else if (err.message) {
      message += err.message;
      if (err.stack) {
        message += '<h3>Stack Trace:</h3>';
        message += '<div>';
        if(err.stack.join) {
          
          err.stack = err.stack.map(processLine);

          message += err.stack.join('<br />');
        } else {
          message += err.stack.replace(/\r?\n/g, '<br />')
          .split('<br />')
          .map(processLine)
          .join('<br />');
        }
        message += '</div>';
      }
    }
  } else {
    message = '';
  }

  if (config.logError) {
    console.error('Error processing request', req.pathInfo, err);
  }

  return {
    status: 500,
    body: ['<html><head><title>Error</title></head><body><h2>An error occurred.</h2>', message, '</body>'],
    headers: {
      'content-type': 'text/html'
    }
  };
}

function processLine (line) {
  if (line.indexOf('From previous event:') > -1) {
    line = '<br /><strong>' + line + '</strong>';
  }
  else if (line.indexOf('node_modules') === -1 && line.indexOf('summit') === -1 && line.indexOf(' (native)') === -1) {
    return '<strong style="color: #BE0000;">&rarr; ' + line + '</strong>';
  }

  return line;
}

var defaultConfig = {
  showError: true,
  logError: true
};

/**
 * Translates rejected promises to a JSGI error response.
 *
 * @param errorResponse {Function}  Optional. A function that returns a JSGI response when passed an error.
 * @returns {Function} JSGI response.
 */
module.exports = function errorMiddleware(config) {
  config = _.extend({}, defaultConfig, config);

  return function (req, nextApp) {
    return q.whenCall(function() { return nextApp(req); }, function(val) { 
      return val;
    }, function (err) {
      return errorResponse(config, req, err);
    });
  };
};