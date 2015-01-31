// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// services
var github = require('../../../server/services/github');
var pullRequest = require('../../../server/services/pullRequest');

// models
var Repo = require('../../../server/documents/repo').Repo;

describe('pullRequest:badgeComment', function(done) {
    it('should set github call parameters correctly', function(done) {
        config.server.github.user = 'githubUser';
        config.server.github.pass = 'githubUserApiKey';

        var repoStub = sinon.stub(Repo, 'findOneAndUpdate', function(query, args, opts, done) {

            assert.equal(query.repo, 123);
            assert.equal(opts.upsert, true);

            done(null, {
                repo: 123,
                comment: true,
                threshold: 1
            });
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            assert.deepEqual(args, {
                obj: 'issues',
                fun: 'createComment',
                arg: {
                    user: 'user',
                    repo: 'repo',
                    number: 456,
                    body: '<a href="https://review.ninja/user/repo/pull/456" target="_blank"><img src="https://review.ninja/123/pull/456/badge" alt="ReviewNinja"/>'
                },
                basicAuth: {
                    user: 'githubUser',
                    pass: 'githubUserApiKey'
                }
            });
        });

        pullRequest.badgeComment('user', 'repo', 123, 456);
        sinon.assert.called(githubStub);
        githubStub.restore();
        repoStub.restore();
        done();
    });

    it('should not post a comment if comment setting is set to false', function(done) {

        var repoStub = sinon.stub(Repo, 'findOneAndUpdate', function(query, args, opts, done) {

            assert.equal(query.repo, 123);
            assert.equal(opts.upsert, true);

            done(null, {
                repo: 123,
                comment: false,
                threshold: 1
            });
        });

        var githubSpy = sinon.spy(github, 'call');

        pullRequest.badgeComment('user', 'repo', 123, 456);

        assert(!githubSpy.called);

        githubSpy.restore();
        repoStub.restore();

        done();
    });
});

describe('pullRequest:isWatched', function(done) {
    it('return true for feature/one if one is watching feature/*', function(done) {
        var settings = {
            watched: ['feature/*']
        };
        var pull = {
            head: {ref: 'feature/one'},
            base: {ref: 'master'}
        };
        assert.equal(pullRequest.isWatched(pull, settings), true);
        done();
    });

    it('return false if one watches feature/*-*-* and feature/one is trying to match', function(done) {
        var settings = {
            watched: ['feature/*.*.*']
        };
        var pull = {
            head: {ref: 'feature/one'},
            base: {ref: 'master'}
        };
        assert.equal(pullRequest.isWatched(pull, settings), false);
        done();
    });

    it('return false if one does not watch any pattern', function(done) {
        var settings = {
            watched: ['abcd']
        };
        var pull = {
            head: {ref: 'feature/one'},
            base: {ref: 'master'}
        };
        assert.equal(pullRequest.isWatched(pull, settings), false);
        done();
    });
});
