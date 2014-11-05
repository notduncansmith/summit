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