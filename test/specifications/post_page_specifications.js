'use strict';
var hoist = require('hoist-core'),
    Application = hoist.models.Application,
    Organisation = hoist.models.Organisation,
    SearchIndex = hoist.models.SearchIndex,
    app = require("../../app"),
    request = require('supertest'),
    http = require('http'),
    _ = require('underscore'),
    q = hoist.q;


var testHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>test</title></head><body>some content</body></html>';
var test = {
    path: '/#!test',
    content: testHtml
};
var test2 = {
    path: test.path,
    content: testHtml.replace('test', 'test2')
};
var test3 = {
    path: '/#!tEst',
    content: testHtml.replace('test', 'test2')
};

var testArray = [{
    path: '/#!test3',
    content: testHtml
}, {
    path: '/#!test',
    content: testHtml
}, {
    path: '/#!test2',
    content: testHtml
}, {
    path: '/#!test4',
    content: testHtml
}];

var testArray2 = [{
    path: '/#!test',
    content: testHtml.replace('test', 'test2')
}, {
    path: '/#!test3',
    content: testHtml.replace('test', 'test2')
}, {
    path: '/#!test2',
    content: testHtml.replace('test', 'test2')
}, {
    path: '/#!test4',
    content: testHtml.replace('test', 'test2')
}];

describe('posting a page', function() {
    this.timeout(5000);
    describe('against an existing application', function() {
        describe('against a new path', function() {
            var _responseReceived;
            before(function() {
                _responseReceived = new Organisation().saveQ()
                    .then(function(org) {
                        return new Application({
                            ownerOrganisation: org._id,
                        }).saveQ();
                    }).then(function(application) {
                        var server = http.createServer(app);
                        var r = request(server)
                            .post('/index')
                            .set('Authorization', 'Hoist ' + application.apiKey)
                            .set('Accept', 'application/json')
                            .send(test);
                        return q.ninvoke(r, "end");
                    });
            });
            it('should create a page in the search index', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages.length.should.equal(1);
                });
            });
            it('should return the saved page', function() {
                return _responseReceived.then(function(response) {
                    response.body.path.should.equal(test.path);
                    response.body.content.should.equal(test.content);
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
        describe('against an existing path', function() {
            var _responseReceived;
            before(function() {
                var saveEntities = [
                    new SearchIndex({
                        pages: [test]
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
                        .post('/index')
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send(test2);
                    return q.ninvoke(r, "end");
                });
            });
            it('should not create a page in the search index', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages.length.should.equal(1);
                });
            });
            it('should not modify the path', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages[0].path.should.equal(test.path);
                });
            });
            it('should modify the content', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages[0].content.should.equal(test2.content);
                });
            });
            it('should return the saved page', function() {
                return _responseReceived.then(function(response) {
                    response.body.path.should.equal(test.path);
                    response.body.content.should.equal(test2.content);
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
                        pages: [test]
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
                        .post('/index')
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send(test3);
                    return q.ninvoke(r, "end");
                });
            });
            it('should not create a page in the search index', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages.length.should.equal(1);
                });
            });
            it('should not modify the path', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages[0].path.should.equal(test.path);
                });
            });
            it('should modify the content', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages[0].content.should.equal(test3.content);
                });
            });
            it('should return the saved page', function() {
                return _responseReceived.then(function(response) {
                    response.body.path.should.equal(test.path);
                    response.body.content.should.equal(test3.content);
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
                        .post('/index')
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


describe('posting an array', function() {
    this.timeout(5000);
    describe('against an existing application', function() {
        describe('with all new paths', function() {
            var _responseReceived;
            before(function() {
                _responseReceived = new Organisation().saveQ()
                    .then(function(org) {
                        return new Application({
                            ownerOrganisation: org._id,
                        }).saveQ();
                    }).then(function(application) {
                        var server = http.createServer(app);
                        var r = request(server)
                            .post('/index')
                            .set('Authorization', 'Hoist ' + application.apiKey)
                            .set('Accept', 'application/json')
                            .send({
                                pages: testArray
                            });
                        return q.ninvoke(r, "end");
                    });
            });
            it('should create pages in the search index', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages.length.should.equal(testArray.length);
                    _.difference(_.pluck(index.pages, 'path'), _.pluck(testArray, 'path')).toString().should.equal('');
                    _.difference(_.pluck(index.pages, 'content'), _.pluck(testArray, 'content')).toString().should.equal('');
                });
            });
            it('should return the saved pages', function() {
                return _responseReceived.then(function(response) {
                    _.difference(_.pluck(response.body, 'path'), _.pluck(testArray, 'path')).toString().should.equal('');
                    _.difference(_.pluck(response.body, 'content'), _.pluck(testArray, 'content')).toString().should.equal('');
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
        describe('against some existing paths', function() {
            var _responseReceived;
            before(function() {
                var saveEntities = [
                    new SearchIndex({
                        pages: testArray2.slice(2)
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
                        .post('/index')
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send({
                            pages: testArray
                        });
                    return q.ninvoke(r, "end");
                });
            });
            it('should create pages in the search index', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages.length.should.equal(testArray.length);
                    _.difference(_.pluck(index.pages, 'path'), _.pluck(testArray, 'path')).toString().should.equal('');
                    _.difference(_.pluck(index.pages, 'content'), _.pluck(testArray, 'content')).toString().should.equal('');
                });
            });
            it('should return the saved pages', function() {
                return _responseReceived.then(function(response) {
                    _.difference(_.pluck(response.body, 'path'), _.pluck(testArray, 'path')).toString().should.equal('');
                    _.difference(_.pluck(response.body, 'content'), _.pluck(testArray, 'content')).toString().should.equal('');
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

        describe('against all existing paths', function() {
            var _responseReceived;
            before(function() {
                var saveEntities = [
                    new SearchIndex({
                        pages: testArray2
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
                        .post('/index')
                        .set('Authorization', 'Hoist ' + application.apiKey)
                        .set('Accept', 'application/json')
                        .send({
                            pages: testArray
                        });
                    return q.ninvoke(r, "end");
                });
            });
            it('should create pages in the search index', function() {
                return _responseReceived.then(function() {
                    return SearchIndex.findOneQ({});
                }).then(function(index) {
                    index.pages.length.should.equal(testArray.length);
                    _.difference(_.pluck(index.pages, 'path'), _.pluck(testArray, 'path')).toString().should.equal('');
                    _.difference(_.pluck(index.pages, 'content'), _.pluck(testArray, 'content')).toString().should.equal('');
                });
            });
            it('should return the saved pages', function() {
                return _responseReceived.then(function(response) {
                    _.difference(_.pluck(response.body, 'path'), _.pluck(testArray, 'path')).toString().should.equal('');
                    _.difference(_.pluck(response.body, 'content'), _.pluck(testArray, 'content')).toString().should.equal('');
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
                        .post('/index')
                        .set('Authorization', 'Hoist notValid')
                        .set('Accept', 'application/json')
                        .send(testArray);
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