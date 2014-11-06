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

    instanceMethods: {
      publish: function () {
        this.published = true;
        return this.save();
      }
    }
  });
}