// Collections

var Post = Cms.collection({
  name: 'Post',
  permissions: { ... },
  fields: { ... }
});

var Post = Cms.collection('Post');

// Fetch
var fooById = Post.get('1234');
var fooBySlug = Post.get('foo-is-a-bar');

// Search
var searchResults = Post.searchFor(['foo', 'bar']);

// List
var allPosts = Post.all()

// Paginate
var pages = Post.all().pages({size: 10})
var pageTWoOfAll = Post.all().page(2, {size: 10})
var pageTwoOfSearch = Post.searchFor('foo', 'bar').page(2, {size: 10})

// Create
var newPost = Post.put({
  title: 'Foo Is A Bar',
  body: 'bar',
  upload: '/uploads/foo.png'
}); 
// => {
//     _id: '1234', 
//     _rev: '1-abcd', 
//     title: 'Foo Is A Bar', 
//     body: 'bar', 
//     upload: '/uploads/foo.png'
//   }

// Save
newPost.title = 'Foo Is A Baz';
newPost.save();


// Posts
// Post types are special collections that are grouped together.
// They should be used like blog posts. A blog feed may
// be composed of items from multiple collections
var posts = Cms.posts()
var postPages = Cms.posts().pages({size: 10});
var postPageTwo = Cms.posts().page(2, {size: 10});


// Users
var foobar = Cms.addUser({
  username: 'foobar',
  email: 'foo@bar.com',
  firstName: 'Foo',
  lastName: 'Bar',
  avatar: '/avatars/foo.png'
});

var foobar = Cms.user('foobar');
var foobar = Cms.user('foo@bar.com');
var mayContainFoobar = Cms.users('foo', 'bar');

// Authentication
var foobar = Cms.authenticate('foobar', 'Passw0rd!'); // throws if bad pass - use .fail()
foobar.resetPassword(); // sends password reset email
foobar.setPassword('newPassword');

// Invites
Cms.inviteUser({
  firstName: 'Foo',
  lastName: 'Bar',
  email: 'foo@bar.com',
  username: 'foobar',
  avatar: '/img/default.png'
});


// Groups
var foos = Cms.addGroup({
  name: 'foos',
  permissions: {
    read: true,
    write: true,
    create: false,
    remove: false
  }
});

var foos = Cms.group('foos');

var foosPerms = foos.permissions();
foos.permissions({
  read: true,
  write: true,
  create: true,
  remove: false
});

// This is not group.addUser because the object
// being modified is the user (pushing onto their 
//  "groups" array) rather than the group itself.
foobar.addToGroup('foos');

// Permissions
var Cms = new CMS({user: foobar}); // use Cms as foobar
var Cms = new CMS({user: null}) ; // use Cms as guest

Post.get('1234') // throws Collection Not Found if user cannot view Posts
Post.get('1234') // throws Item Not Found if user cannot view post
Post.searchFor('foo', 'bar') // filters by permissions - throws Collection Not Found if user cannot view Posts
Post.all() // throws Collection Not Found

