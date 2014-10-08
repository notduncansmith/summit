var CMS = require('./lib/cms');

CMS.bogart = require('bogart-edge');
CMS._ = require('lodash');
CMS.inflection = require('inflection');
CMS.Promise = require('bluebird');
CMS.uuid = require('node-uuid').v4;
CMS.Facebook = require('./lib/fb.js');

module.exports = CMS;