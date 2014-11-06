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

    },

    instanceMethods: {
      publish: function () {
        this.published = true;
        return this.save();
      }
    }
  });
}