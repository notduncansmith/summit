



Buckets - post templates
Posts - units of buckets

_groups/admin
  permissions: {
    writers: {
      read: true
      write: true
      create: true
      delete: false
    }
  }


_bucket/foo
  fields: {
    title: 'string'
    body: 'text'
    image: 'upload'
    template: [Select a template]
  }

_posts/1234
  data: {
    title: 'How I learned to stop worrying and love CouchDB'
    body: '**It rocks**'
    image: 0
  }
  rendered: '<h1>How I learned to stop worrying and love CouchDB</h1><p><strong>It rocks</strong></p>'
  template: 'posts'

Markdown WYSIWYG

Handlebars templates



Create a new Bucket:
  Pick fields

Create a new Post:
  Fill out fields
  Pick a slug (wordpress-style)

Posts grouped by Bucket

Posts have a date

Uploads to disk (AWS S3 support enhancement)

Alternate formats (default html):
  ?format=json ?format=markdown

Pages


Collections have an "Is Post Type" property, which determines whether or not they will appear in the "Blog post" view

