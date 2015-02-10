# Documentation
Anything would be nice.

# Testing
The current tests are based on an old iteration of the framework so they will need to be tweaked a bit to work.  After that, we should start working towards actual test coverage.

# Yeoman Generators
  - Skeleton (see bottom)
  - Collection
  - View

# Branding
  - Logo
  - Favicon
  - Landing Page
  - ~~Github Repo~~

# Collections
  - Use `type` instead of `collection` (if `collection` is detected, and matches collection name, warn)
  - Notice "[foo]Id" pattern and automatically add "by[Foo]" view
  - All Collections should be Event Emitters and emit CRUD by default
  - Pagination on lookups
  - Class methods
  - All `find` methods should return instances of Item (right now just returning raw data)
  - Instance methods
  - Computed properties (getter/setter implementation, API may take some thought)
  - Location
    - Zip
    - City
    - State
    - Lat
    - Lng
    - Geospatial search

# Deprecation Warning
  - Summit._deprecate
  - Decorate function with console.warn, deprication notice (includes name + message)

# User
 - Invite user by email
 - Security Questions
 - Events:
  - Register (should already be implemented a la "create")
  - Login
  - Failed login
  - Password reset

# Routing
  - Rate-limit
    - Global or by-route
    - By IP
    - By session

# Social
  - Better Facebook integration (friends, friendsOfFriends, share)
  - Twitter (login/OAuth, followers, following, generate profile/intent/avatar links)
  - Google+ (login/OAuth, contacts, share, generate profile/intent/avatar links)
  - Gravatar integration

# Controllers
- Controller#beforeEach
- Controller#routeFor
- Controller#restful
- Controller#autoRoute
- Controller#router
- Dependency-injected

# ~~Database~~
  - ~~Driver-ify database access~~
  - ~~PouchDB search~~

# Multitenant
  - Probably should make Silo.js for management (API will take some thought)
  - Auth integration
  - Magically use appropriate DB for collection lookups
  - Dependency Injection (userDb)
  - `db: 'someDb'` option for all collection lookups

# Admin Panel
  - Default "Admin" group
  - Gamma Grids for all collections w/CRUD+search support
  - Special Nav w/links to analytics/grids
  - Manage API Keys
  - Email Addresses
  - CMS
  - Email Templates
  - Analytics
    - Signups (day, week, month, year)
    - Collection metrics (d/w/m/y)
    - Revenue (d/w/m/y)
    - Google Analytics highlights
  - Logs

# Logging
  - Pick a logging library
  - Attach to a bunch of events
  - Request-level logging

# Payments
  - Stripe API integration
  - Subscriptions
  - Purchases
  - Dunning
  - Payment Profiles
    - CC Form
    - Billing Address
    - Shipping Address
    - User can have multiple
    - Payment Profile management
  - Discounts
  - Trials
  - Lockout

# Email
  - ~~Mandrill integration~~
  - ~~Forgot Password~~
  - Email Confirmation
  - User.notify(), User#notify
  - Group.notify(), Group#notify
  - Admin.notify(), uses configured admin email(s)
  - All notifications can accept arrays of IDs
  - All notifications mix calling object into template data

# ~~Search~~
  - ~~ElasticSearch integration~~
  - ~~Collection#search~~
  - ~~Pagination~~

# Plugins
  - **DONE:** See `./lib/plugin.js`
  - Example implementation in `./cms`
  - ~~Use-case: Common features (like CMS), API integrations~~
  - ~~Consumable as node module~~
  - ~~plugin.css~~
  - ~~plugin.js~~
  - ~~View object (bogart_handlebars)~~
  - ~~Middleware~~
  - ~~Collections~~
  - ~~Services~~
  - Plugin Repository

# Sherpa
  - Front-end companion library
  - Cannibalize Hello.js for OAuth
  - Magic "Login With [network]" buttons
  - Cannibalize GammaGrid, FW, Dropzone, SmoothScroll, Rivets
  - Ajaxify forms
  - Upload (attachment) support
  - Web intents for Twitter/FB/Google
  - Broken image support
  - Declarative tooltip="foo"
  - Analytics integration (GA, Facebook)
  - FormWarden
    - Integrate wrapper into FW
    - Declarative HTML API
    - Default validators
  - GammaGrid
    - Use ?page=&size=
    - Make sexy
    - Page size dropdown (already in?)
    - Ajax

# REST
  - ~~Magically generated API routes~~
  - Magically generated HTML routes
  - ~~Declared on collection~~
  - ~~Full CRUD support~~
  - ~~Always `use`d last so can easily overridden~~
  - Template convetion: views/collection_name/action.hbs (create, read, update, delete, _read)
  - Default template if template not available (use form generation)
  - Routes (prepend with "/collection-name")
    - Create: POST /
    - Read: GET /:id, GET /all
    - Update: POST /:id
    - Delete: POST /:id/delete
  - ~~API routes~~
    - Default {prefix: '/api', version: true}
    - {it: 'worked', result: APIResult, data: Item}
    - {it: 'failed', reason: 'User-friendly message', err: Error}
  - Pagination support for list (?page=&size=)

# Dependency Injection
  - If /collection-name/:id pattern, fetch it and dependency inject it as collectionNameCamelCased (e.g. `/group/1234` injects group with _id "1234" as `group`)
  - Automatically inject
    - ~~user~~
    - ~~session~~
    - ~~app~~
    - ~~Collections~~
    - ~~Facebook~~
    - ~~Twitter~~
    - Google+
    - Google Maps
    - Data
      - US States
      - Countries
  - Inject into
    - ~~Routes~~
    - Event handlers
    - Collection class/instance methods

# Skeleton
```
  .git/
  assets/
    js/
      app.js
      libs/
      src/
    less/
      _bootstrap.less
      _type.less
      _variables.less
      app.less
    css/
      app.css
    img/
    favicon.ico
  lib/
    collections/
      page.js
    routers/
      page_router.js
      user_router.js
      admin_router.js
    middleware/
      page_variables.js
  node_modules/
    summit/
  .bowerrc
  .gitignore
  app.js
  bower.json
  config.example.js
  config.js
  gulpfile.js
   - LESS (+ build)
   - JS (+ build)
   - Bootstrap JS
   - jQuery
   - Lodash
   - Sherpa
  package.json
  README.md
```
