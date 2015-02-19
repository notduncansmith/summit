var mu = require('mustache')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , mandrill = require('mandrill-api/mandrill');

module.exports = function (app) {
  var EmailTemplate = app.collection({
    name: 'EmailTemplate',
    fields: {
      name: 'string',
      subject: 'string',
      body: 'string'
    },
    design: {
      views: {
        byName: {
          map: function (doc) {
            if (doc.type === 'EmailTemplate' && doc.name) {
              emit(doc.name, doc);
            }
          }
        }
      }
    }
  });

  app.inject('Mailer', function () {
    return new Mailer(app.config, EmailTemplate);
  }, true);
};

function Mailer (config, coll) {
  this.config = config;
  this.coll = coll;
  this.api = new mandrill.Mandrill(this.config.mandrill.apiKey);
}

Mailer.prototype.send = function (templateName, toUser, withData, fromEmail, fromName) {
  var fromEmail = fromEmail || this.config.mandrill.fromEmail;
  var fromName = fromName || this.config.mandrill.fromName;
  var toEmail = ''
    , user = {}
    , withData = withData || {}
    , api = this.api;

  if (typeof toUser === 'string') {
    // must be an email address
    toEmail = toUser;
  }
  else {
    user = toUser;
    toEmail = user.email;
  }

  withData = _.extend({user: user}, withData);

  return this._render(templateName, withData)
  .then(function (template) {
    return sendMail({
      api: api,
      toEmail: toEmail,
      body: template.body,
      fromEmail: fromEmail,
      fromName: fromName,
      subject: template.subject
    });
  });
};

Mailer.prototype._render = function(template, withData) {
  if (typeof template !== 'string') {
    // We were passed a template object
    return new Promise(function (resolve) {
      resolve({
        subject: mu.render(template.subject, withData),
        body: mu.render(template.body, withData)
      });
    });
  }

  // We were passed a template name
  return this.template(templateName)
  .then(function (template) {
    return {
      subject: mu.render(template.subject, withData),
      body: mu.render(template.body, withData)
    };
  });
};

Mailer.prototype.template = function(name, subject, template) {
  if (subject && template) {
    // Create a new template
    return this.coll.put({
      name: name,
      body: template,
      subject: subject
    });
  }
  else {
    // Get existing template
    return this.coll.view('byName', {keys: [name]})
    .then(function (results) {
      if (results.length === 0) {
        throw new Error('Could not find a template named "' + name + '".');
      }

      return results[0];
    });
  }
};

function sendMail (opts) {
  var toEmail = opts.toEmail
    , body = opts.body
    , fromEmail = opts.fromEmail
    , fromName = opts.fromName
    , subject = opts.subject
    , api = opts.api;

  var message = {
    html: body,
    subject: subject,
    from_email: fromEmail,
    from_name: fromName,
    to: [{
      email: toEmail,
      type: 'to'
    }]
  };

  var opts = {
    message: message,
    async: false,
    ip_pool: 'Main Pool'
  };

  return new Promise(function (resolve, reject) {
    api.messages.send(opts, function (result) {
      resolve(result);
    });
  });
}