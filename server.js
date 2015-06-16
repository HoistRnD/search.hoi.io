'use strict';

process.env['NODE_ENV'] = process.env['NODE_ENV'] || 'development';

console.log(process.env['NODE_ENV']);

var config = require('config');

var app = require('./app');

app.listen(config.port, function() {
    console.log('auth.hoi.io listening at ', config.port);
});