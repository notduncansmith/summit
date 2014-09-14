# Proposed Architecture

A CMS, at its core, should be a repository of *content* (hence the C).  Thus, in WB-CMS, we eschew the traditional Wordpress tradition of "everything is a post" (which is blog-centric) for a more general content philosophy: "everything is data".

------

# Philosophy - Data over Blog Posts

**Item**: *a piece of raw data that belongs to a collection.*
**Collection**: *group of items with similar structure.*

Items are NOT necessarily posts: they are data.  For example, a common task for a CMS may be to store a profile for each employee at a company.  Wordpress might want each of these to be a "Post".  However, they're not posts - they're team members.  They are best represented by raw data, and this is how WB-CMS works.  A team member might look something like this: 

```javascript
{
  firstName: "Duncan",
  lastName: "Smith",
  headshot: "/img/headshots/duncan.jpg",
  fullPic: "/img/employees/duncan.jpg",
  title: "Senior Designer",
  bio: "Duncan Smith joined the Whiteboard team in March 2013...",
  createdAt: "1/2/3456",
  joined: "March 2013"
}
```

Notice that this has no templates attached to it, nor a permalink, nor anything other than the data. As such, various pieces of the CMS may use it as they see fit.  An About page may pull in each team member, to be templated something like this: 

```hbs
{{#team}}
  <article>
    <header>
      <h1>{{firstName}} {{lastName}}</h1>
      <p>Joined: {{joined}}</p>
    </header>
    
    {{{markdown bio}}}
  </article>
{{/team}}
```

However, were this team member to write a blog post, one might want to use this data like so:

```hbs
{{#author}}
  <p>By <a href="{{aboutPage}}">{{author}}</a></p>
{{/author}}
```

This is the flexibility that we get with Items instead of Posts. We are able to use our data as *data*, rather than trying to shoehorn everything into a blog model.

------

# Collections

Collections basically serve as an ORM over CouchDB.  You might be wondering, "Why the hell do I need an ORM?  Everything in Couch is already an object!".  You're right, we do store objects directly in Couch; however, marshalling objects in and out of the database is only half of an ORM's job.  The other half is to provide a rich API for querying and managing those objects, and this is the service that Collections provide.

When you have a Collection as an abstraction over the database, you can do cool stuff like this:

```javascript
var fooById = MyCollection.get('1234');
var fooBySlug = MyCollection.get('foo-is-a-bar');
```

Want to do a search?  You got it:

```javascript
var searchResults = MyCollection.searchFor('foo', 'bar');
```

Want pagination?  No problemo: 

```javascript
var pages = MyCollection.all().pages({size: 10})
var pageTWoOfAll = MyCollection.all().page(2, {size: 10})
var pageTwoOfSearch = MyCollection.searchFor('foo', 'bar').page(2, {size: 10})
```

This allows you to treat your data like data, and use it how you want to.


By the way, I'm aware that this is nothing new: Collections in WB-CMS are akin to Models in [Sequelize|Mongoose|ActiveRecord].  However, no such system currently exists for Couch, so we had to implement it.

------

# Templating

WB-CMS doesn't touch templates, at all.  You may wonder why - after all, isn't half the point of a CMS to provide a templating solution, so that the data can be used by application users?  Yes, it is - but when your CMS is a library, there's no need for that library to have any opinions whatsoever about templating.  By having nothing to do with it, we don't force any restrictions on the application developer.  Not to mention, they're already going to have their own templating solution for the rest of their app (around the CMS): thus, a built-in templating system would be largely redundant.

------

# Posts

You may have seen something about Posts, but didn't I say up above that we don't want to deal with posts?  Well, it's true that not *everything* should be a post - however, we're writing a CMS here!  One of the primary goals for end-users is to blog, or post otherwise time-sequential content.  It thusly makes absolute sense for us to have some concepts of Posts within the system.

But, what truly differentiates a Post from any other item?  Well, two things:
1. It is a piece of written content, intended for reading by end-users.
2. It exists as part of a stream of Items, which may or may not be from the same collection.

As such, the implementation within WB-CMS is rather simple: a Post is any Item that belongs to a Collection with the isPostType property.

By allowing Posts to exist in multiple collections, we get Categories essentially for free.  One might have a Collection called "Programming Language Reviews", and another called "Laptop Reviews".  When the content stream is viewed as a whole, both of these are relevant. An avid reader of the site probably finds both of these interesting: and in any typical blog context, these posts would be intermingled throughout the content stream, perhaps along with regular blog posts.

However, each is also its own type of content. These may follow a different format: while Laptop Reviews might have fields like Battery Life or Sound Quality, Programming Language Reviews might have fields like Type System or Syntax. One might conceive of these data fields being displayed in some sort of TL;DR section in a sidebar, or perhaps aggregated from multiple posts into a table.

One might also consider having a "Laptop Reviews" link in the header, where a reader could go to read exclusively Laptop Reviews (maybe they aren't so big into programming languages).

By keeping these posts as Collections, we get the power to do that.  Each post is just data, and they're kept completely separate; however, by virtue of the isPostType flag, we also have an easy way to aggregate items from each of these Collections into a traditional blog post stream.

**Posts are treated as Markdown.  As such, each Post's string attributes (aside from `_id` and `_rev` of course) are decorated with a method called `render`, which will send that field's contents through WB-CMS's Markdown engine[1].**


[1]  This engine is Marked by default.  WB-CMS exposes the `render` property, which is just a function that should take a raw Markdwon string as input and return an HTML string as output.  

------

# Users, Groups, and Permissions

Users within the CMS are pretty simple.  They're just objects that consist of a first name, last name, username, email, hashed password, and groups list.  Of course more data can be stored on these users (as one probably would if one were building an app), but the CMS doesn't care.

Authenticating a user is easy:

```javascript
Cms.authenticate(username, attemptedPassword)
```

WB-CMS uses [bcrypt](https://github.com/ncb000gt/node.bcrypt.js) behind the scenes.  If the authentication fails (because the user is not found, the password is incorrect, or the database cannot be reached), the promise will be rejected.  The reason will be given, so you can handle different errors in different ways.  If we had trouble reaching the database, some message like "Sorry, we're having some technical difficulties..." would suffice; if the password is wrong or the user isn't found, the error message should be along the lines of "Sorry, that user could not be found or the password was incorrect. Please try again."  For security reasons, we don't want to simply say "Incorrect password", because that would imply that the username was correct, and a bruteforcer has just found a target to narrow in on.

Once the authentication is successful, we'll have a user.  The instance of WB-CMS used to authenticate the user will be automatically scope to that user, and will handle permissions transparently[1].  This means that if a user doesn't have read access to a particular resource, the CMS will return a 404 Not Found (again, for security purposes - a 403 would implicitly confirm that the resource exists).  If the user looks at a list of resources (say, search results), some of which they may not have read access to, those blocked resources will be filtered from the result set.

Speaking of permissions, let's talk about how those are set.  Permissions can be set at three levels: the Group level, the Collection level, and the Item level.

Groups are just, well, groups (of users).  WB-User might have called them "roles".  We call them Groups, following in Linux's footsteps.  Each Group has a certain set of base permissions: read and write.  These are applicable to all Collections by default.  A common group taxonomy might look like this:

```javascript
{
  staff: true,
  guests: {
    read: true,
    write: false
  },
  haters: false // block the haters
}
```

Notice the shorthand in the case of `admin` and `haters`: when declaring permissions for Groups, a single Boolean value will automatically be applied to all permission types.

Collections can also receive permissions.  These would be declared identically as above, on the `permissions` field of a Collection:

```javascript
Cms.collection({
  name: 'Team Members',
  permissions: {
    staff: true,
    guests: {
      read: true,
      write: false
    }
  }
});
```

Collection permissions will overwrite permissions on Groups. Any Group not specified will, by default, have the same permissions as those declared on the Group.

Finally, permissions can be set per-item.  These follow the same rules as Collection permissions, with one exception: each Item has an implicit permission level called `owner`.  These permissions default to `{read: true, write: true}`, and apply only to the user which created the Item.  If an Item does not have a `userId` field, this permission level is not created.  These permissions can be overwritten at the Collection level: if you wanted to create a data type that cannot be modified after creation (e.g. an invoice or instant message), you could simply set the permissions on that collection as such: 

```javascript
permissions: {
  owner: {read: true, write: false}
}
```

<!-- PLANNED FUNCTIONALITY -->
<!-- Users can be invited via email[2] to the system by other users.  The invite permission specifies whether members of a given Group may invite other people to that Group. When a user invites someone to a given group, that user receives an email with a signup link.  This link points to a form pre-populated with the given user's information, as specified by the inviter. -->

[1]  You may want to create a new instance of CMS for each request: this is perfectly okay (in fact encouraged).  A good pattern for maintaining the advantages of having a CMS instance scoped to a particular user is to store the user on the session, then use a Bogart injector factory to create the CMS instance based off the session user.

<!-- [2]  Mandrill is used for this by default.  This may be overwritten, simply assign a value to the `emailProvider` property on an instance of CMS (you can pass this into the constructor).  An emailProvider can be any function that implements the argument signature `(name, email, message)` and returns a promise. -->

------

# Menus

What would a CMS be without Menu management?

Menus in WB-CMS are implemented on top of Collections.  Like Posts, they have a special flag used when declaring the Collection: `isMenuType`.  They can be interacted with just like a regular Collection. Each Item in the Collection must contain an `href` property (this is what will be used to link items in the menu).

------

# Media

Wordpress has a pretty good model for handling media uploads, so we're going to copy (err, *draw inspiration from*) it. Uploads all go to one central location, and can be used from any post by simply referencing that upload's URL.  By default, these will be stored on disk.  Eventually, I'd like to include an AWS S3 option.

------


# Interface

One of the goals of WB-CMS is to abstract away the interfaces necssary for creating and updating Items.  WB-CMS exposes a property called `form` on each Collection.  This is a Handlebars template for the form used to create and edit Items from that Collection.  This can be read straight off the Collection and included as a partial in views, making it dead-simple to embed these forms within your application's layout.

Alternatively, WB-CMS exposes a more magical option:

```javascript
app.use(MyCollection.resource(pathToLayout));
```

This method will return a router that automatically handles the following actions:

`GET  /collectionName`
`GET  /collectionName/new`
`POST /collectionName/create`
`GET  /collectionName/:id`
`POST /collectionName/:id`
`POST /collectionName/:id/delete`

WB-CMS will use whatever layout you pass in to render those form-fields automatically.

This option is fine for quickly bootstrapping a project, but is *not recommended for production use*.

**A note on forms: WB-CMS uses Bootstrap-compatible markup when generating forms.**

------

# API

## CMS

```javascript
var Cms = new CMS({
  db: {
    host: 'localhost', 
    port: 5984
  }, 
  user: foobar
});
```

