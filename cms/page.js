var slugify = require('./services')().slugify;

module.exports = function (app) {
  return app.collection({
    name: 'Page',
    isPostType: true,
    timestamps: true,
    permalink: '/{{slug}}',

    fields: {
      title: 'string',
      body: 'text',
      get slug() {
        return slugify(this.title);
      },
      set slug(newSlug) {
        this.permalink = '/' + newSlug;
      }
    },

    design: {
      views: {
        bySlug: {
          map: function (doc) {
            if (doc.type === 'Page' && doc.slug) {
              emit(doc.slug, doc);
            }
          }
        },
        by_slug: {
          map: function (doc) {
            if (doc.type == 'Page' && doc.slug) {
              emit(doc.slug, doc);
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
