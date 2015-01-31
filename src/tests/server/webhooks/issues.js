// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// io
global.io = {emit: function() {}};

// documents
var User = require('../../../server/documents/user').User;
var Milestone = require('../../../server/documents/milestone').Milestone;

// webhooks
var issues = require('../../../server/webhooks/issues');

// services
var url = require('../../../server/services/url');
var github = require('../../../server/services/github');
var status = require('../../../server/services/status');
var pullRequest = require('../../../server/services/pullRequest');
var notification = require('../../../server/services/notification');

describe('issue', function(done) {
    it('should exit silently if user not found', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/issues/closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, null);
        });

        issues(req, {
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

    it('should exit silently if milestone not found', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/issues/closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {});
        });

        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.deepEqual(args, {
                repo: 23588185,
                number: 1
            });
            done(null, null);
        });

        issues(req, {
            status: function(code) {
                assert.equal(code, 404);
                return this;
            },
            send: function(msg) {
                assert.equal(msg, 'Milestone not found');
                userStub.restore();
                milestoneStub.restore();
                done();
            }
        });
    });
});

describe('issue:opened', function(done) {
    it('should set status and send notification', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/issues/opened.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {token: 'token'});
        });

        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.deepEqual(args, {
                repo: 23588185,
                number: 3
            });
            done(null, {
                pull: 1,
                repo: 23588185,
                number: 3
            });
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            assert.deepEqual(args, {
                obj: 'pullRequests',
                fun: 'get',
                arg: {
                    user: 'reviewninja',
                    repo: 'foo',
                    number: 1
                },
                token: 'token'
            });
            done(null, {
                number: 1,
                head: {sha: 'sha'}
            });
        });

        var statusStub = sinon.stub(status, 'update', function(args) {
            assert.deepEqual(args, {
                user: 'reviewninja',
                repo: 'foo',
                repo_uuid: 23588185,
                sha: 'sha',
                number: 1,
                token: 'token'
            });
        });

        var notificationStub = sinon.stub(notification, 'sendmail', function(notification_type, user, repo, repo_uuid, token, number, args) {
            assert.equal(notification_type, 'new_issue');
            assert.equal(user, 'reviewninja');
            assert.equal(repo, 'foo');
            assert.equal(repo_uuid, 23588185);
            assert.equal(number, 1);
            assert.equal(token, 'token');

            assert.equal(args.user, 'reviewninja');
            assert.equal(args.repo, 'foo');
            assert.equal(args.number, 1);
            assert.equal(args.sender.login, 'dfarr');
            assert.equal(args.url, url.reviewPullRequest('reviewninja', 'foo', 1));
        });

        issues(req, {
            end: function() {
                userStub.restore();
                milestoneStub.restore();
                githubStub.restore();
                statusStub.restore();
                notificationStub.restore();
                done();
            }
        });
    });
});

describe('issue:closed', function(done) {
    it('should set status and send notification', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/issues/closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {token: 'token'});
        });

        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.deepEqual(args, {
                repo: 23588185,
                number: 1
            });
            done(null, {
                pull: 2,
                repo: 23588185,
                number: 1
            });
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {

            if(args.obj === 'issues') {
                assert.deepEqual(args, {
                    obj: 'issues',
                    fun: 'getMilestone',
                    arg: {
                        user: 'reviewninja',
                        repo: 'foo',
                        number: 1
                    },
                    token: 'token'
                });
                done(null, {
                    open_issues: 0
                });
            }

            if(args.obj === 'pullRequests') {
                assert.deepEqual(args, {
                    obj: 'pullRequests',
                    fun: 'get',
                    arg: {
                        user: 'reviewninja',
                        repo: 'foo',
                        number: 2
                    },
                    token: 'token'
                });
                done(null, {
                    number: 2,
                    head: {sha: 'sha'}
                });
            }
        });

        var statusStub = sinon.stub(status, 'update', function(args) {
            assert.deepEqual(args, {
                user: 'reviewninja',
                repo: 'foo',
                repo_uuid: 23588185,
                sha: 'sha',
                number: 2,
                token: 'token'
            });
        });

        var notificationStub = sinon.stub(notification, 'sendmail', function(notification_type, user, repo, repo_uuid, token, number, args) {
            assert.equal(notification_type, 'closed_issue');
            assert.equal(user, 'reviewninja');
            assert.equal(repo, 'foo');
            assert.equal(repo_uuid, 23588185);
            assert.equal(number, 2);
            assert.equal(token, 'token');

            assert.equal(args.user, 'reviewninja');
            assert.equal(args.repo, 'foo');
            assert.equal(args.number, 2);
            assert.equal(args.sender.login, 'dfarr');
            assert.equal(args.url, url.reviewPullRequest('reviewninja', 'foo', 2));
        });

        issues(req, {
            end: function() {
                userStub.restore();
                milestoneStub.restore();
                githubStub.restore();
                statusStub.restore();
                notificationStub.restore();
                done();
            }
        });
    });

    it('should set status but not send a notification (still open issues)', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../../fixtures/webhooks/issues/closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {token: 'token'});
        });

        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.deepEqual(args, {
                repo: 23588185,
                number: 1
            });
            done(null, {
                pull: 2,
                repo: 23588185,
                number: 1
            });
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {

            if(args.obj === 'issues') {
                assert.deepEqual(args, {
                    obj: 'issues',
                    fun: 'getMilestone',
                    arg: {
                        user: 'reviewninja',
                        repo: 'foo',
                        number: 1
                    },
                    token: 'token'
                });
                done(null, {
                    open_issues: 4
                });
            }

            if(args.obj === 'pullRequests') {
                assert.deepEqual(args, {
                    obj: 'pullRequests',
                    fun: 'get',
                    arg: {
                        user: 'reviewninja',
                        repo: 'foo',
                        number: 2
                    },
                    token: 'token'
                });
                done(null, {
                    number: 2,
                    head: {sha: 'sha'}
                });
            }
        });

        var statusStub = sinon.stub(status, 'update', function(args) {
            assert.deepEqual(args, {
                user: 'reviewninja',
                repo: 'foo',
                repo_uuid: 23588185,
                sha: 'sha',
                number: 2,
                token: 'token'
            });
        });

        var notificationSpy = sinon.spy(notification, 'sendmail');

        issues(req, {
            end: function() {
                assert(notificationSpy.notCalled);
                userStub.restore();
                milestoneStub.restore();
                githubStub.restore();
                statusStub.restore();
                notificationSpy.restore();
                done();
            }
        });
    });
});
