// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// services
var url = require('../../../server/services/url');
var github = require('../../../server/services/github');

// models
var Star = require('../../../server/documents/star').Star;
var Repo = require('../../../server/documents/repo').Repo;
var Milestone = require('../../../server/documents/milestone').Milestone;

// service
var status = require('../../../server/services/status');

describe('status:update', function() {
    it('should treat null stars and issues as 0 and it should set the status to pending', function(done) {

        var repoStub = sinon.stub(Repo, 'findOneAndUpdate', function(query, args, opts, done) {

            assert.equal(query.repo, 1234);
            assert.equal(opts.upsert, true);

            done(null, {
                repo: 1234,
                comment: true,
                threshold: 1
            });
        });

        var starStub = sinon.stub(Star, 'find', function(args, done) {
            done(null, null);
        });

        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.deepEqual(args, {
                pull: 1,
                repo: 1234
            });
            done(null, null);
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            if(args.obj === 'issues' && args.fun === 'getMilestone') {
                done(null, null);
            }
            if(args.obj === 'statuses' && args.fun === 'create') {
                assert.deepEqual(args, {
                    obj: 'statuses',
                    fun: 'create',
                    arg: {
                        user: 'user',
                        repo: 'repo',
                        sha: 'sha',
                        state: 'pending',
                        description: 'ReviewNinja: 1 star needed, 0 issues',
                        target_url: 'https://review.ninja/user/repo/pull/1',
                        context: 'code-review/reviewninja'
                    },
                    token: 'token'
                });
                done(null, null);
            }
        });

        var args = {
            user: 'user',
            repo: 'repo',
            repo_uuid: 1234,
            sha: 'sha',
            number: 1,
            token: 'token'
        };

        status.update(args, function(err, status) {
            sinon.assert.called(repoStub);
            sinon.assert.called(starStub);
            sinon.assert.called(milestoneStub);
            sinon.assert.called(githubStub);

            repoStub.restore();
            starStub.restore();
            milestoneStub.restore();
            githubStub.restore();
            done();
        });
    });

    it('should be a successful review if stars > 0 and no issues', function(done) {

        var repoStub = sinon.stub(Repo, 'findOneAndUpdate', function(query, args, opts, done) {

            assert.equal(query.repo, 1234);
            assert.equal(opts.upsert, true);

            done(null, {
                repo: 1234,
                comment: true,
                threshold: 1
            });
        });

        var starStub = sinon.stub(Star, 'find', function(args, done) {
            done(null, [{user: 'user', repo: 'repo'}]);
        });

        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.deepEqual(args, {
                pull: 1,
                repo: 1234
            });
            done(null, {
                pull: 1,
                repo: 123,
                number: 2
            });
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            if(args.obj === 'issues' && args.fun === 'getMilestone') {
                done(null, null);
            }
            if(args.obj === 'statuses' && args.fun === 'create') {
                assert.deepEqual(args, {
                    obj: 'statuses',
                    fun: 'create',
                    arg: {
                        user: 'user',
                        repo: 'repo',
                        sha: 'sha',
                        state: 'success',
                        description: 'ReviewNinja: 1 star, 0 issues',
                        target_url: 'https://review.ninja/user/repo/pull/1',
                        context: 'code-review/reviewninja'
                    },
                    token: 'token'
                });
                done(null, null);
            }
        });

        var args = {
            user: 'user',
            repo: 'repo',
            repo_uuid: 1234,
            sha: 'sha',
            number: 1,
            token: 'token'
        };

        status.update(args, function(err, status) {
            sinon.assert.called(repoStub);
            sinon.assert.called(starStub);
            sinon.assert.called(milestoneStub);
            sinon.assert.called(githubStub);

            repoStub.restore();
            starStub.restore();
            milestoneStub.restore();
            githubStub.restore();
            done();
        });
    });

    it('should be a failed review if stars > 0 and issues exist', function(done) {

        var repoStub = sinon.stub(Repo, 'findOneAndUpdate', function(query, args, opts, done) {

            assert.equal(query.repo, 1234);
            assert.equal(opts.upsert, true);

            done(null, {
                repo: 1234,
                comment: true,
                threshold: 1
            });
        });

        var starStub = sinon.stub(Star, 'find', function(args, done) {
            done(null, [{user: 'user', repo: 'repo'}]);
        });

        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.deepEqual(args, {
                pull: 1,
                repo: 1234
            });
            done(null, {
                pull: 1,
                repo: 123,
                number: 2
            });
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            if(args.obj === 'issues' && args.fun === 'getMilestone') {
                done(null, {open_issues: 3});
            }
            if(args.obj === 'statuses' && args.fun === 'create') {
                assert.deepEqual(args, {
                    obj: 'statuses',
                    fun: 'create',
                    arg: {
                        user: 'user',
                        repo: 'repo',
                        sha: 'sha',
                        state: 'failure',
                        description: 'ReviewNinja: 1 star, 3 issues',
                        target_url: 'https://review.ninja/user/repo/pull/1',
                        context: 'code-review/reviewninja'
                    },
                    token: 'token'
                });
                done(null, null);
            }
        });

        var args = {
            user: 'user',
            repo: 'repo',
            repo_uuid: 1234,
            sha: 'sha',
            number: 1,
            token: 'token'
        };

        status.update(args, function(err, status) {
            sinon.assert.called(repoStub);
            sinon.assert.called(starStub);
            sinon.assert.called(milestoneStub);
            sinon.assert.called(githubStub);

            repoStub.restore();
            starStub.restore();
            milestoneStub.restore();
            githubStub.restore();
            done();
        });
    });
});
