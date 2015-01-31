// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// io
global.io = {emit: function() {}};

// models
var User = require('../../../server/documents/user').User;
var Star = require('../../../server/documents/star').Star;
var Settings = require('../../../server/documents/settings').Settings;

// services
var url = require('../../../server/services/url');
var github = require('../../../server/services/github');
var notification = require('../../../server/services/notification');
var status = require('../../../server/services/status');

// api
var star = require('../../../server/api/star');

describe('star:all', function() {
    it('should set the correct parameters when calling find', function(done) {
        var starStub = sinon.stub(Star, 'find', function(args, done) {
            assert.deepEqual(args, {sha: 'sha', repo: 'repo'});
            done();
        });

        var req = {
            args: {
                sha: 'sha',
                repo_uuid: 'repo'
            }
        };

        star.all(req, function(error, res) {
            sinon.assert.called(starStub);
            starStub.restore();
            done();
        });
    });
});

describe('star:get', function() {
    it('should set the correct parameters when calling get', function(done) {
        var starStub = sinon.stub(Star,'findOne', function(args, done) {
            assert.deepEqual(args, {sha: 'sha', repo: 'repo', user: 1234});
            done();
        });

        var req = {
            args: {
                repo_uuid: 'repo',
                sha: 'sha'
            },
            user: {
                id: 1234
            }
        };

        star.get(req, function(err, res) {
            sinon.assert.called(starStub);
            starStub.restore();
            done();
        });
    });
});

describe('star:set', function() {

    it('should return an error if github call repos one errors', function(done) {
        var githubStub = sinon.stub(github, 'call', function(args, done) {
            done('github repos one error');
        });

        var req = {
            args: {
                repo_uuid: 1
            },
            user: {
                token: 'token'
            }
        };

        star.set(req, function(err, star) {
            assert.equal(err, 'github repos one error');
            sinon.assert.called(githubStub);
            githubStub.restore();
            done();
        });
    });

    it('should return an error if github call repos one returns permission to pull does not exists', function(done) {
        var githubStub = sinon.stub(github, 'call', function(args, done) {
            done(null, {permissions: {}});
        });

        var req = {
            args: {
                repo_uuid: 1
            },
            user: {
                token: 'token'
            }
        };

        star.set(req, function(err, star) {
            assert.deepEqual(err, {
                code: 403,
                text: 'Forbidden'
            });
            sinon.assert.called(githubStub);
            githubStub.restore();
            done();
        });
    });

    it('should create a star and update statuses/notifications accordingly', function(done) {

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            assert.deepEqual(args, {
                obj: 'repos',
                fun: 'one',
                arg: {id: 1},
                token: 'token'
            });

            done(null, {permissions: {pull: true}});
        });

        var starStub = sinon.stub(Star, 'create', function(args, done) {
            assert.deepEqual(args, {
                sha: 'sha',
                repo: 1,
                user: 3,
                name: 'login',
                created_at: '4'
            });

            done(null, {});
        });

        var notificationStub = sinon.stub(notification, 'sendmail',
            function(notification_type, user, repo, repo_uuid, repo_token, pull_request_number, args) {
                assert.equal(notification_type, 'star');
                assert.equal(user, 'user');
                assert.equal(repo, 'repo');
                assert.equal(repo_uuid, 1);
                assert.equal(repo_token, 'token');
                assert.equal(pull_request_number, 2);
                assert.deepEqual(args, {
                    user: 'user',
                    repo: 'repo',
                    number: 2,
                    sender: {id:3, login:'login', token:'token'},
                    url: url.reviewPullRequest('user', 'repo', 2)
                });
            });

        var dateStub = sinon.stub(Date, 'now', function() {
            return 4;
        });

        var statusStub = sinon.stub(status, 'update', function(args) {
            assert.deepEqual(args, {
                user: 'user',
                repo: 'repo',
                sha: 'sha',
                repo_uuid: 1,
                number: 2,
                token: 'token'
            });
        });

        var emitStub = sinon.stub(io, 'emit', function(channel, args) {
            assert.equal(channel, 'user:repo:pull_request');
            assert.deepEqual(args, {
                action: 'starred',
                number: 2
            });
        });

        var req = {
            args: {
                sha: 'sha',
                repo: 'repo',
                user: 'user',
                name: 'name',
                repo_uuid: 1,
                number: 2
            },
            user: {
                id: 3,
                login: 'login',
                token: 'token'
            }
        };

        star.set(req, function(err, res) {
            sinon.assert.called(githubStub);
            sinon.assert.called(starStub);
            sinon.assert.called(notificationStub);
            sinon.assert.called(dateStub);
            sinon.assert.called(statusStub);
            sinon.assert.called(emitStub);
            githubStub.restore();
            starStub.restore();
            notificationStub.restore();
            dateStub.restore();
            statusStub.restore();
            emitStub.restore();
            done();
        });
    });

});

describe('star:rmv', function() {

    it('should return an error if github call repos one errors', function(done) {
        var githubStub = sinon.stub(github, 'call', function(args, done) {
            done('github repos one error');
        });

        var req = {
            args: {
                repo_uuid: 1
            },
            user: {
                token: 'token'
            }
        };

        star.rmv(req, function(err, star) {
            assert.equal(err, 'github repos one error');
            sinon.assert.called(githubStub);
            githubStub.restore();
            done();
        });
    });

    it('should return an error if github call repos one returns permission to pull does not exists', function(done) {
        var githubStub = sinon.stub(github, 'call', function(args, done) {
            done(null, {permissions: {}});
        });

        var req = {
            args: {
                repo_uuid: 1
            },
            user: {
                token: 'token'
            }
        };

        star.rmv(req, function(err, star) {
            assert.deepEqual(err, {
                code: 403,
                text: 'Forbidden'
            });
            sinon.assert.called(githubStub);
            githubStub.restore();
            done();
        });
    });
});
