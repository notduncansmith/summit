var slugify = require('./services')().slugify;

module.exports = function (app) {
  return app.collection({
    name: 'Post',
    isPostType: true,
    timestamps: true,

    fields: {
      title: 'string',
      body: 'text',
      get slug() {
        return slugify(this.title);
      },
      set slug(newSlug) {
        this.permalink = '/post/' + newSlug;
      }
    },

    design: {
      views: {
        bySlug: {
          map: function (doc) {
            if (doc.collection === 'Post' && doc.slug) {
              emit(doc.slug, doc);
            }
          }
        },
        by_publishedAtYMD: {
          map: function (doc) {
            if (doc.collection === 'Post' && doc.publishedAtYMD) {
              emit(doc.publishedAtYMD, doc);
            }
          }
        }
      }
    },

    instanceMethods: {
      publish: function () {
        this.published = true;
        return this.save();
      }
    }
  });
};