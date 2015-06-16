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

var testPath = '/index?path=/?_escaped_fragment_=test';
var testPath3 = '/index?path=/?_escaped_fragment_=tEst';

var testPages = [{
    path: '/#!test3',
    content: testHtml
}, {
    path: '/#!test',
    content: testHtml
}, {
    path: '/#!test2',
    content: testHtml
}];

describe('getting a page', function() {
    this.timeout(5000);

    describe('against an existing application', function() {
        describe('against existing path', function() {
            var _responseReceived;
            before(function() {
                var saveEntities = [
                    new SearchIndex({
                        pages: testPages
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
                        .get(testPath)
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send();
                    return q.ninvoke(r, "end");
                });
            });
            it('should return the saved page', function() {
                return _responseReceived.then(function(response) {
                    response.text.should.equal(testHtml);
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

        describe('against existing mixed case path', function() {
            var _responseReceived;
            before(function() {
                var saveEntities = [
                    new SearchIndex({
                        pages: testPages
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
                        .get(testPath3)
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send();
                    return q.ninvoke(r, "end");
                });
            });
            it('should return the saved page', function() {
                return _responseReceived.then(function(response) {
                    response.text.should.equal(testHtml);
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
                        pages: testPages
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
                        .get('/index')
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send();
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
                        .get('/index')
                        .set('Authorization', 'Hoist notValid')
                        .set('Accept', 'application/json')
                        .send();
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