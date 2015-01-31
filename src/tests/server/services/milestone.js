// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// documents
var Milestone = require('../../../server/documents/milestone').Milestone;

// service
var github = require('../../../server/services/github');
var milestone = require('../../../server/services/milestone');

describe('milestone:get', function(done) {
    it('should return milestone if found and exists in github', function(done) {
        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.equal(args.repo, 1);
            assert.equal(args.pull, 2);
            done(null, {
                repo: 1,
                pull: 2,
                number: 3
            });
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            assert.equal(args.obj, 'issues');
            assert.equal(args.fun, 'getMilestone');
            assert.equal(args.token, 'token');
            assert.deepEqual(args.arg, {
                user: 'user',
                repo: 'repo',
                number: 3
            });

            done(null, true);
        });

        milestone.get('user', 'repo', 1, 2, 'token', function(err, milestone) {
            assert.deepEqual(milestone, {
                repo: 1,
                pull: 2,
                number: 3
            });
            sinon.assert.called(milestoneStub);
            sinon.assert.called(githubStub);
            milestoneStub.restore();
            githubStub.restore();
            done();
        });
    });

    it('should update and return milestone if found but does not exist in github', function(done) {
        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.equal(args.repo, 1);
            assert.equal(args.pull, 2);
            done(null, {
                repo: 1,
                pull: 2,
                number: 3
            });
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {

            assert.equal(args.obj, 'issues');
            assert.equal(args.token, 'token');

            if(args.fun === 'getMilestone') {
                assert.deepEqual(args.arg, {
                    user: 'user',
                    repo: 'repo',
                    number: 3
                });
                done(true);
            }

            if(args.fun === 'createMilestone') {
                assert.deepEqual(args.arg, {
                    user: 'user',
                    repo: 'repo',
                    title: 'ReviewNinja PR #2'
                });
                done(null, {number: 3});
            }
        });

        var milestoneCreateStub = sinon.stub(Milestone, 'findOneAndUpdate', function(query, update, options, done) {
            assert.deepEqual(query, {
                pull: 2,
                repo: 1
            });

            assert.equal(update.number, 3);
            assert.equal(options.upsert, true);

            done(null, {
                repo: 1,
                pull: 2,
                number: 3
            });
        });

        milestone.get('user', 'repo', 1, 2, 'token', function(err, milestone) {
            assert.deepEqual(milestone, {
                repo: 1,
                pull: 2,
                number: 3
            });

            assert.equal(githubStub.callCount, 2);
            sinon.assert.called(milestoneStub);
            sinon.assert.called(githubStub);
            sinon.assert.called(milestoneCreateStub);

            milestoneStub.restore();
            githubStub.restore();
            milestoneCreateStub.restore();
            done();
        });
    });

    it('should create milestone if not found', function(done) {
        var milestoneFindOneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.equal(args.repo, 1);
            assert.equal(args.pull, 2);
            done(null, null);
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {

            assert.equal(args.obj, 'issues');
            assert.equal(args.token, 'token');

            if(args.fun === 'getMilestone') {
                assert.deepEqual(args.arg, {
                    user: 'user',
                    repo: 'repo',
                    number: null
                });
                done(true);
            }

            if(args.fun === 'createMilestone') {
                assert.deepEqual(args.arg, {
                    user: 'user',
                    repo: 'repo',
                    title: 'ReviewNinja PR #2'
                });
                done(null, {number: 3});
            }
        });

        var milestoneCreateStub = sinon.stub(Milestone, 'findOneAndUpdate', function(query, update, options, done) {
            assert.deepEqual(query, {
                pull: 2,
                repo: 1
            });

            assert.equal(update.number, 3);
            assert.equal(options.upsert, true);

            done(null, {
                repo: 1,
                pull: 2,
                number: 3
            });
        });

        milestone.get('user', 'repo', 1, 2, 'token', function(err, milestone) {
            assert.deepEqual(milestone, {
                repo: 1,
                pull: 2,
                number: 3
            });

            assert.equal(githubStub.callCount, 2);
            sinon.assert.called(milestoneFindOneStub);
            sinon.assert.called(githubStub);
            sinon.assert.called(milestoneCreateStub);

            milestoneFindOneStub.restore();
            githubStub.restore();
            milestoneCreateStub.restore();

            done();
        });
    });

    it('should return error if mongo return error', function(done) {
        var milestoneFindOneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            done('mongodb error', null);
        });

        milestone.get('user', 'repo', 1, 2, 'token', function(err, milestone) {
            assert.equal(err, 'mongodb error');
            sinon.assert.called(milestoneFindOneStub);

            milestoneFindOneStub.restore();
            done();
        });
    });

    it('should return error if github fails to create milestone', function(done) {
        var milestoneFindOneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.equal(args.repo, 1);
            assert.equal(args.pull, 2);
            done(null, null);
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {

            assert.equal(args.obj, 'issues');
            assert.equal(args.token, 'token');

            if(args.fun === 'getMilestone') {
                assert.deepEqual(args.arg, {
                    user: 'user',
                    repo: 'repo',
                    number: null
                });
                done(true);
            }

            if(args.fun === 'createMilestone') {
                assert.deepEqual(args.arg, {
                    user: 'user',
                    repo: 'repo',
                    title: 'ReviewNinja PR #2'
                });
                done('github error', null);
            }
        });

        milestone.get('user', 'repo', 1, 2, 'token', function(err, milestone) {
            assert.equal(err, 'github error');
            assert.equal(githubStub.callCount, 2);
            sinon.assert.called(milestoneFindOneStub);
            sinon.assert.called(githubStub);

            milestoneFindOneStub.restore();
            githubStub.restore();

            done();
        });
    });
});

describe('milestone:close', function(done) {
    it('should silently exit if no milestone found', function(done) {
        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.equal(args.repo, 1);
            assert.equal(args.pull, 2);
            done(null, null);
        });

        milestone.close('user', 'repo', 1, 2, 'token');
        sinon.assert.called(milestoneStub);

        milestoneStub.restore();
        done();
    });

    it('should close milestone if milestone found', function(done) {
        var milestoneStub = sinon.stub(Milestone, 'findOne', function(args, done) {
            assert.equal(args.repo, 1);
            assert.equal(args.pull, 2);
            done(null, {
                repo: 1,
                pull: 2,
                number: 3
            });
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            assert.equal(args.obj, 'issues');
            assert.equal(args.token, 'token');

            if(args.fun === 'getMilestone') {
                assert.deepEqual(args.arg, {
                    user: 'user',
                    repo: 'repo',
                    number: 3
                });
                done(null, {
                    number: 3,
                    title: 'ReviewNinja PR #2'
                });
            }

            if(args.fun === 'updateMilestone') {
                assert.deepEqual(args.arg, {
                    user: 'user',
                    repo: 'repo',
                    number: 3,
                    title: 'ReviewNinja PR #2',
                    state: 'closed'
                });
            }
        });

        milestone.close('user', 'repo', 1, 2, 'token');

        sinon.assert.called(milestoneStub);
        sinon.assert.called(githubStub);

        milestoneStub.restore();
        githubStub.restore();
        done();
    });
});
