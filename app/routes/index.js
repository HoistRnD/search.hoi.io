'use strict';
var controller = require("../controllers/search_controller"),
    passport = require('passport');
    
module.exports = function(app) {
    app.get('/ping', controller.ping);
    app.post('/index', passport.authenticate('hoist'), controller.post);
    app.get('/index', passport.authenticate('hoist'), controller.get);
    app.delete('/index', passport.authenticate('hoist'), controller.delete);
    app.options('*', function(req, res) {
        res.send("ok");
    });
};