'use strict';
var hoist = require('hoist-core'),
    SearchIndex = hoist.models.SearchIndex,
    _ = require('underscore'),
    url = require('url');

exports.ping = function(req, res) {
    res.send({
        ok: true,
        node: process.env.NODE_NAME,
        port: process.env.PORT
    });
    return;
};

function postSingle(req, res) {
    var path = req.body.path.toLowerCase();
    var regex = /\?_escaped_fragment_=/;
    path = path.replace(regex, '#!');
    SearchIndex.findByIdQ(req.environment.searchIndex)
        .then(function(searchIndex) {
            if (!searchIndex) {
                searchIndex = new SearchIndex();
            }
            var page = _.find(searchIndex.pages, function(p) {
                return p.path === path;
            });

            if (page) {
                page.content = req.body.content;
            } else {
                searchIndex.pages.push({
                    path: path,
                    content: req.body.content
                });
            }
            return searchIndex.saveQ();
        }).then(function(searchIndex) {
            var toSend = _.find(searchIndex.pages, function(p) {
                return p.path === path;
            });
            res.status(200);
            res.send(toSend);
            req.environment.searchIndex = searchIndex._id;
            return req.application.saveQ();
        }).fail(function(error) {
            hoist.error(error, req, req.user);
            res.send(500, error.message);
        }).done();
}

function postArray(req, res) {
    var pages = req.body.pages;
    var regex = /\?_escaped_fragment_=/;
    _.each(pages, function(page) {
        page.path = page.path? page.path.toLowerCase().replace(regex, '#!'): '';
    });

    SearchIndex.findByIdQ(req.environment.searchIndex)
        .then(function(searchIndex) {
            if (!searchIndex) {
                searchIndex = new SearchIndex();
            }
            _.each(pages, function(page) {
                var path = page.path;
                var existingPage = _.find(searchIndex.pages, function(p) {
                    return p.path === path;
                });

                if (existingPage) {
                    existingPage.content = page.content;
                } else {
                    searchIndex.pages.push({
                        path: path,
                        content: page.content
                    });
                }
            });
            return searchIndex.saveQ();
        }).then(function(searchIndex) {
            var paths = _.pluck(pages, 'path');
            var toSend = _.filter(searchIndex.pages, function(p) {
                return _.contains(paths, p.path);
            });
            res.status(200);
            res.send(toSend);
            req.environment.searchIndex = searchIndex._id;
            return req.application.saveQ();
        }).fail(function(error) {
            hoist.error(error, req, req.user);
            res.send(500, error.message);
        }).done();
}

exports.post = function(req, res) {
    if (req.body.path) {
        postSingle(req, res);
    } else if (req.body.pages) {
        postArray(req, res);
    } else {
        res.send(500, 'something went wrong');
    }
};

exports.get = function(req, res) {
    var regex = /\?_escaped_fragment_=/;
    var parsedUrl = url.parse(req.url.toLowerCase(), true);
    var path = parsedUrl.query.path ? parsedUrl.query.path : '';
    var query = '?path=';
    var index = path.indexOf(query);
    if (index !== -1) {
        path = path.substring(index + query.length);
    }
    path = path.replace(regex, '#!');
    SearchIndex.findByIdQ(req.environment.searchIndex)
        .then(function(searchIndex) {
            if (!searchIndex) {
                res.status(404);
                res.send({});
                return;
            }
            var page = _.find(searchIndex.pages, function(p) {
                return p.path === path;
            });
            if (page) {
                res.set('Content-Type', 'text/html');
                res.send(page.content);
            } else {
                res.status(404);
                res.send({});
            }
        }).fail(function(error) {
            hoist.error(error, req, req.user);
            res.send(500, error.message);
        }).done();
};


exports.delete = function(req, res) {
    var path = req.body.path ? req.body.path.toLowerCase() : '';
    var regex = req.body.regex;
    var toDelete = [];
    SearchIndex.findByIdQ(req.environment.searchIndex)
        .then(function(searchIndex) {
            if (!searchIndex) {
                res.status(404);
                res.send({});
                return;
            }
            if (regex) {
                if (path.slice(-2) === '/*' || path.slice(-2) === '/+') {
                    toDelete = _.filter(searchIndex.pages, function(p) {
                        return p.path === path.slice(0, -2);
                    });
                    path = path.slice(0, -1) + '+';
                }
                toDelete = toDelete.concat(_.filter(searchIndex.pages, function(p) {
                    return p.path.search(path) === 0;
                }));
            } else {
                toDelete = _.filter(searchIndex.pages, function(p) {
                    return p.path === path;
                });
            }
            if (toDelete.length) {
                _.each(toDelete, function(page) {
                    searchIndex.pages.id(page.id).remove();
                });
                return searchIndex.saveQ();
            } else {
                res.status(404);
                res.send({});
            }
        }).then(function(searchIndex) {
            if (searchIndex) {
                var page = _.find(searchIndex.pages, function(p) {
                    return (regex && (p.path.search(path) === 0 || p.path === path.slice(0, -2))) || (!regex && p.path === path); // might need to be changed for case with meta tag ie original path does not contain #!
                });
                if (page) {
                    res.send(500, "something went wrong");
                } else {
                    res.send({
                        removed: toDelete.length
                    });
                }
            }
        }).fail(function(error) {
            hoist.error(error, req, req.user);
            res.send(500, error.message);
        }).done();
};