var CMS = require('./lib/cms');

CMS.bogart = require('bogart-edge');
CMS._ = require('lodash');
CMS.inflection = require('inflection');
CMS.Promise = require('bluebird');

module.exports = CMS;