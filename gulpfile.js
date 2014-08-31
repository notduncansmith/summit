var gulp = require('gulp')
  
  // Gulp plugins
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , less = require('gulp-less')
  , livereload = require('gulp-livereload')
  , replace = require('gulp-replace');

var paths = {
  styles: [
    './assets/bower_components/bootstrap/less/bootstrap.less',
    './assets/bower_components/lesshat/build/lesshat-prefixed.less',
    './assets/less/app.less'
  ],

  allStyles: [
    './assets/bower_components/bootstrap/less/bootstrap.less',
    './assets/less/_variables.less',
    './assets/less/*.less'
  ],

  vendor: [
    './assets/bower_components/jquery/dist/jquery.min.js'

    // Compatibility libraries
  , './assets/bower_components/respond/dest/respond.min.js'
  , './assets/bower_components/fastclick/lib/fastclick.js'
  , './assets/bower_components/es5-shim/es5-shim.min.js'
  , './assets/bower_components/es5-shim/es5-sham.min.js'

    // Vendor libararies
  , './assets/bower_components/bootstrap/dist/js/bootstrap.js'
  , './assets/bower_components/mustache/mustache.js'
  , './assets/bower_components/lodash/dist/lodash.min.js'
  , './assets/bower_components/momentjs/min/moment.min.js'
  , './assets/bower_components/jquery-ui/ui/minified/jquery-ui.min.js'
  , './assets/bower_components/dropzone/downloads/dropzone.min.js'
  , './assets/bower_components/rivets/dist/rivets.js'


    // Internal libraries
  // , './assets/js/libs/jquery.formwarden.js'
  // , './assets/js/libs/formwarden.js'
  , './assets/js/libs/stately.js'
  // , './assets/js/libs/wb.js'
  ],

  scripts: [
    './assets/js/src/validators/*.js' 
  , './assets/js/src/admin/*.js'
  , './assets/js/src/*.js'
  ]
};

var defaultTasks = [
  'vendor',
  'styles',
  'watch'
];

var buildTasks = [
  'stylesMin',
  'vendorMin'
];

gulp.task('styles', function () {
  return gulp.src(paths.styles)
  .pipe(less({
    paths: paths.allStyles,
    dumpLineNumbers: 'comments',
  }))
  .pipe(gulp.dest('./assets/css'));
});

gulp.task('stylesMin', function () {
  return gulp.src(paths.styles)
  .pipe(less({
    paths: paths.allStyles,
    dumpLineNumbers: 'comments',
    compress: true
  }))
  .pipe(gulp.dest('./assets/css'));
});

gulp.task('vendor', function () {
  return gulp.src(paths.vendor)
  .pipe(concat('vendor.js'))
  .pipe(gulp.dest('./assets/js/'));
});

gulp.task('vendorMin', function () {
  return gulp.src(paths.vendor)
  .pipe(uglify())
  .pipe(concat('vendor.js'))
  .pipe(gulp.dest('./assets/js/'));
})


gulp.task('watch', function () {
  var server = livereload();
  
  gulp.watch(['./assets/less/*.less', './assets/less/**/*.less'], ['styles']);
  
  gulp.watch(paths.vendor, ['vendor']);

  gulp.watch(['./assets/css/app.css'])
  .on('change', function () {
    server.changed('/css/app.css');
  });
});

gulp.task('build', buildTasks);
gulp.task('default', defaultTasks);
