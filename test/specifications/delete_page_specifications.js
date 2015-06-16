'use strict';
var hoist = require('hoist-core'),
    Application = hoist.models.Application,
    Organisation = hoist.models.Organisation,
    SearchIndex = hoist.models.SearchIndex,
    app = require("../../app"),
    request = require('supertest'),
    http = require('http'),
    q = hoist.q;


var testHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>test</title></head><body>some content</body></html>';
var test = {
    path: '/#!test'
};

var test2 = {
    path: '/#!tEst'
};

var test3 = {
    path: '/#!test',
    content: testHtml
};


var regexPages = [{
    path: '/#!test',
    content: testHtml
}, {
    path: '/#!test/x',
    content: testHtml
}, {
    path: '/#!test/y',
    content: testHtml
},{
    path: '/#!nottest/',
    content: testHtml
},{
    path: '/#!testnot',
    content: testHtml
}];

var regexTest = {
    path: '/#!test/*',
    regex: true
};

describe('deleting a page', function() {
    this.timeout(5000);

    describe('against an existing application', function() {

        describe('against an existing path', function() {
            var _responseReceived;
            before(function() {
                var saveEntities = [
                    new SearchIndex({
                        pages: [test3]
                    }).saveQ(),
                    new Organisation().saveQ()
                ];
                _responseReceived = q.allSettled(saveEntities).then(function(entities) {
                    return new Application({
                        ownerOrganisation: entities[1].value._id,
                        environments: [{
                            name: '_default',
                            token: 'default',
                            searchIndex: entities[0].value._id,
                            isDefault: true
                        }]
                    }).saveQ();
                }).then(function(application) {
                    var r = request(http.createServer(app))
                        .del('/index')
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send(test);
                    return q.ninvoke(r, "end");
                });
            });
            it('should remove the page from the index', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages.length.should.equal(0);
                });
            });
            it('should return the number of deleted pages', function() {
                return _responseReceived.then(function(response) {
                    response.body.removed.should.equal(1);
                });
            });
            it('should return a 200 response', function() {
                return _responseReceived.then(function(response) {
                    response.statusCode.should.equal(200);
                });
            });
            after(function(done) {
                SearchIndex.remove({}, function() {
                    Organisation.remove({}, function() {
                        Application.remove({}, done);
                    });
                });
            });
        });
        
        describe('against an existing mixed case path', function() {
            var _responseReceived;
            before(function() {
                var saveEntities = [
                    new SearchIndex({
                        pages: [test3]
                    }).saveQ(),
                    new Organisation().saveQ()
                ];
                _responseReceived = q.allSettled(saveEntities).then(function(entities) {
                    return new Application({
                        ownerOrganisation: entities[1].value._id,
                        environments: [{
                            name: '_default',
                            token: 'default',
                            searchIndex: entities[0].value._id,
                            isDefault: true
                        }]
                    }).saveQ();
                }).then(function(application) {
                    var r = request(http.createServer(app))
                        .del('/index')
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send(test2);
                    return q.ninvoke(r, "end");
                });
            });
            it('should remove the page from the index', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages.length.should.equal(0);
                });
            });
            it('should return the number of deleted pages', function() {
                return _responseReceived.then(function(response) {
                    response.body.removed.should.equal(1);
                });
            });
            it('should return a 200 response', function() {
                return _responseReceived.then(function(response) {
                    response.statusCode.should.equal(200);
                });
            });
            after(function(done) {
                SearchIndex.remove({}, function() {
                    Organisation.remove({}, function() {
                        Application.remove({}, done);
                    });
                });
            });
        });

        describe('against an existing regex path', function() {
            var _responseReceived;
            before(function() {
                var saveEntities = [
                    new SearchIndex({
                        pages: regexPages
                    }).saveQ(),
                    new Organisation().saveQ()
                ];
                _responseReceived = q.allSettled(saveEntities).then(function(entities) {
                    return new Application({
                        ownerOrganisation: entities[1].value._id,
                        environments: [{
                            name: '_default',
                            token: 'default',
                            searchIndex: entities[0].value._id,
                            isDefault: true
                        }]
                    }).saveQ();
                }).then(function(application) {
                    var r = request(http.createServer(app))
                        .del('/index')
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send(regexTest);
                    return q.ninvoke(r, "end");
                });
            });
            it('should remove the pages from the index', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages.length.should.equal(2);
                });
            });
            it('should return the number of deleted pages', function() {
                return _responseReceived.then(function(response) {
                    response.body.removed.should.equal(3);
                });
            });
            it('should return a 200 response', function() {
                return _responseReceived.then(function(response) {
                    response.statusCode.should.equal(200);
                });
            });
            after(function(done) {
                SearchIndex.remove({}, function() {
                    Organisation.remove({}, function() {
                        Application.remove({}, done);
                    });
                });
            });

        });

        describe('against a non existant path', function() {
            var _responseReceived;
            before(function() {
                var saveEntities = [
                    new SearchIndex({
                        pages: [test3]
                    }).saveQ(),
                    new Organisation().saveQ()
                ];
                _responseReceived = q.allSettled(saveEntities).then(function(entities) {
                    return new Application({
                        ownerOrganisation: entities[1].value._id,
                        environments: [{
                            name: '_default',
                            token: 'default',
                            searchIndex: entities[0].value._id,
                            isDefault: true
                        }]
                    }).saveQ();
                }).then(function(application) {
                    var r = request(http.createServer(app))
                        .del('/index')
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send('');
                    return q.ninvoke(r, "end");
                });
            });
            it('should return a 404 response', function() {
                return _responseReceived.then(function(response) {
                    response.statusCode.should.equal(404);
                });
            });
            after(function(done) {
                SearchIndex.remove({}, function() {
                    Organisation.remove({}, function() {
                        Application.remove({}, done);
                    });
                });
            });
        });

    });

    describe('against a non existant application', function() {
        var _responseReceived;
        before(function() {
            _responseReceived = new Organisation().saveQ()
                .then(function(org) {
                    return new Application({
                        ownerOrganisation: org._id,
                    }).saveQ();
                })
                .then(function() {
                    var r = request(http.createServer(app))
                        .del('/index')
                        .set('Authorization', 'Hoist notValid')
                        .set('Accept', 'application/json')
                        .send(test);
                    return q.ninvoke(r, "end");
                });

        });
        it('should return a 401 response', function() {
            return _responseReceived.then(function(response) {
                response.statusCode.should.equal(401);
            });
        });
        after(function(done) {
            SearchIndex.remove({}, function() {
                Organisation.remove({}, function() {
                    Application.remove({}, done);
                });
            });
        });
    });
});