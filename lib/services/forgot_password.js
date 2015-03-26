var moment = require('moment')
  , Promise = require('bluebird')
  , _ = require('lodash');

module.exports = function (app) {
  var coll = app.collection({
    name: 'ForgotPasswordToken',
    fields: {
      email: 'email',
      userId: 'string'
    }
  });

  app.inject('ForgotPassword', function (Mailer) {
    var template = {
      subject: 'Your password recovery link',
      body: 'Here is your password recovery link: {{link}}'
    };

    return {
      withEmail: function (email) {
        var collections = app.userCollections();

        return Promise.all(collections.map(function (c) {
          return c.findByEmail(email);
        }))
        .then(function (results) {
          var notFound = 'Sorry, we couldn\'t find an account associated with that email address.'
            , user = results[0]
            , results = _.flatten(results);

          if (user === false) {
            throw new Error(notFound);
          }
          else {
            return coll.write({email: email, userId: user._id})
            .then(function (results) {
              var recoveryLink = app.config.environment.url + '/reset-password?token=' + results._id;
              var templateData = {link: recoveryLink};

              return Mailer.send(template, user, templateData);
            });
          }
        });
      },

      withToken: function (token) {
        return coll.get(token)
        .then(function (fpRecord) {
          var timestamp = moment(fpRecord.createdAt, moment.ISO_8601)
            , weekAgo = moment().add(1, 'weeks');

          if (timestamp.isAfter(weekAgo)) {
            return {
              valid: false,
              reason: 'Expired token'
            };
          }

          return {
            valid: true,
            email: fpRecord.email
          };
        })
        .catch(function (err) {
          if (err === 'missing' || err === 'deleted') {
            return {
              valid: false,
              reason: 'Bad token'
            };
          }
          else {
            throw err;
          }
        });
      }
    };
  }, true);
};