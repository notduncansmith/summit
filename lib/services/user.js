module.exports = function (app) {
  var User = app.collection({
    name: 'User',
    isUserType: true,
    fields: {
      service: 'hidden',
      email: 'email',
      username: 'string',
      firstName: 'string',
      lastName: 'string',
      password: 'password',
      phone: 'phone',
      facebookId: 'hidden',
      twitterId: 'hidden',
      facebookToken: 'hidden'
    },
    views: {
      byUsername: {
        map: function (doc) {
          if (doc.isUser) {
            emit(doc.username, doc);
          }
        }
      },

      byTwitterId: {
        map: function (doc) {
          if (doc.isUser && doc.twitterId) {
            emit(doc.twitterId, doc);
          }
        }
      },

      byFacebookId: {
        map: function (doc) {
          if (doc.isUser && doc.facebookId) {
            emit(doc.facebookId, doc);
          }
        }
      },

      byEmail: {
        map: function (doc) {
          if (doc.isUser && doc.email) {
            emit(doc.email, doc);
          }
        }
      }
    }
  });

  return User;
};