'use strict';
/**
 * Module dependencies.
 */

var express = require('express'),
	hoist = require('hoist-core'),
	config = hoist.utils.defaults;

if(!config.debug){
	require('newrelic');
}


hoist.init();
hoist.auth.init(require('passport'));
var routes = require('./app/routes');
var app = express();

require('./config/express')(app);

routes(app);

module.exports = app;