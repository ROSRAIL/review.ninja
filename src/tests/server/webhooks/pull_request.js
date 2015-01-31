// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// io
global.io = {emit: function() {}};

// documents
var User = require('../../../server/documents/user').User;
var Repo = require('../../../server/documents/repo').Repo;

// webhooks
var pull_request = require('../../../server/webhooks/pull_request');

// services
var url = require('../../../server/services/url');
var milestone = require('../../../server/services/milestone');
var notification = require('../../../server/services/notification');
var status = require('../../../server/services/status');
var pullRequest = require('../../../server/services/pullRequest');

describe('pull_request', function(done) {
    it('should exit silently if user not found', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/pull_request/closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, null);
        });

        pull_request(req, {
            status: function(code) {
                assert.equal(code, 404);
                return this;
            },
            send: function(msg) {
                assert.equal(msg, 'User not found');
                userStub.restore();
                done();
            }
        });
    });
});

describe('pull_request:opened', function() {
    it('should update the status, send a notification, and create a PR comment', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/pull_request/opened.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {
                token: 'token'
            });
        });

        var statusStub = sinon.stub(status, 'update', function(args) {
            assert.deepEqual(args, {
                user: 'reviewninja',
                repo: 'foo',
                sha: 'c85e0f58b2cd8facac288ee02eccfcea9fbce7bb',
                repo_uuid: 23588185,
                number: 68,
                token: 'token'
            });
        });

        var notificationStub = sinon.stub(notification, 'sendmail',
            function(notification_type, user, repo, repo_uuid, token, number, args) {
                assert.equal(notification_type, 'pull_request_opened');
                assert.equal(user, 'reviewninja');
                assert.equal(repo, 'foo');
                assert.equal(repo_uuid, 23588185);
                assert.equal(number, 68);
                assert.equal(token, 'token');

                assert.equal(args.user, 'reviewninja');
                assert.equal(args.repo, 'foo');
                assert.equal(args.number, 68);
                assert.equal(args.sender.login, 'dfarr');
                assert.equal(args.url, url.reviewPullRequest('reviewninja', 'foo', 68));
            });


        var badgeCommentStub = sinon.stub(pullRequest, 'badgeComment', function(user, repo, repo_uuid, number) {
            assert.equal(user, 'reviewninja');
            assert.equal(repo, 'foo');
            assert.equal(repo_uuid, 23588185);
            assert.equal(number, 68);
        });

        pull_request(req, {
            end: function() {
                userStub.restore();
                statusStub.restore();
                notificationStub.restore();
                badgeCommentStub.restore();
                done();
            }
        });
    });
});

describe('pull_request:synchronize', function() {
    it('should update the status, send a notification, and emit a websocket', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/pull_request/synchronize.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {
                token: 'token'
            });
        });

        var statusStub = sinon.stub(status, 'update', function(args) {
            assert.deepEqual(args, {
                user: 'reviewninja',
                repo: 'foo',
                sha: '610b9b34c555cef7e449088ee215ed57bd79f0f3',
                repo_uuid: 23588185,
                number: 34,
                token: 'token'
            });
        });

        var notificationStub = sinon.stub(notification, 'sendmail',
            function(notification_type, user, repo, repo_uuid, token, number, args) {
                assert.equal(notification_type, 'pull_request_synchronized');
                assert.equal(user, 'reviewninja');
                assert.equal(repo, 'foo');
                assert.equal(repo_uuid, 23588185);
                assert.equal(number, 34);
                assert.equal(token, 'token');

                assert.equal(args.user, 'reviewninja');
                assert.equal(args.repo, 'foo');
                assert.equal(args.number, 34);
                assert.equal(args.sender.login, 'dfarr');
                assert.equal(args.url, url.reviewPullRequest('reviewninja', 'foo', 34));
            });

        var emitStub = sinon.stub(io, 'emit', function(channel, arg) {
            assert.equal(channel, 'reviewninja:foo:pull-request-34:synchronize');
            assert.equal(arg, '610b9b34c555cef7e449088ee215ed57bd79f0f3');
        });

        pull_request(req, {
            end: function() {
                userStub.restore();
                statusStub.restore();
                notificationStub.restore();
                emitStub.restore();
                done();
            }
        });
    });
});

describe('pull_request:closed', function() {
    it('should emit "merged" to sockets', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/pull_request/closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {
                token: 'token'
            });
        });

        var emitStub = sinon.stub(io, 'emit', function(channel, arg) {
            assert.equal(channel, 'reviewninja:foo:pull-request-42:merged');
            assert.equal(arg, 42);
        });

        pull_request(req, {
            end: function() {
                userStub.restore();
                emitStub.restore();
                done();
            }
        });
    });

    it('should close milestone', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/pull_request/closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {
                token: 'token'
            });
        });

        var milestoneStub = sinon.stub(milestone, 'close',
            function(user, repo, repo_uuid, number, token) {
                assert.equal(user, 'reviewninja');
                assert.equal(repo, 'foo');
                assert.equal(repo_uuid, 23588185);
                assert.equal(number, 42);
                assert.equal(token, 'token');
            });

        pull_request(req, {
            end: function() {
                userStub.restore();
                milestoneStub.restore();
                done();
            }
        });
    });
});
