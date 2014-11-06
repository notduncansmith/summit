var inflection = require('inflection');

module.exports = function (app) {
  var Page = {
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
  };
}