// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// service
var url = require('../../../server/services/url');

describe('url:socket', function(done) {
    it('should by default be http://localhost:5000', function(done) {
        assert.equal(url.socket, 'http://localhost:5000');
        done();
    });
});

describe('url:baseUrl', function(done) {
    it('should by default be https://review.ninja', function(done) {
        assert.equal(url.baseUrl, 'https://review.ninja');
        done();
    });
});

describe('url:githubBase', function(done) {
    it('should by default be https://github.com', function(done) {
        assert.equal(url.githubBase, 'https://github.com');
        done();
    });
});

describe('url:githubApiBase', function(done) {
    it('should by default be https://api.github.com', function(done) {
        assert.equal(url.githubApiBase, 'https://api.github.com');
        done();
    });
});

describe('url:githubProfile', function(done) {
    it('should by default be /user', function(done) {
        assert.equal(url.githubProfile(), 'https://api.github.com/user');
        done();
    });
});

describe('url:githubProfile', function(done) {
    it('should be /api/v3/user if pathprefix is set', function(done) {
        config.server.github.pathprefix = '/api/v3';
        assert.equal(url.githubProfile(), 'https://api.github.com/api/v3/user');
        done();
    });
});

describe('url:githubFileReference', function(done) {
    it('should by default be https://api.github.com/user/repo/blob/fileref', function(done) {
        assert.equal(url.githubFileReference('user', 'repo', 'fileref'),
                    'https://github.com/user/repo/blob/fileref');
        done();
    });
});

describe('url:reviewPullRequest', function(done) {
    it('should by default be https://review.ninja/user/repo/pull/1', function(done) {
        assert.equal(url.reviewPullRequest('user', 'repo', 1),
                    'https://review.ninja/user/repo/pull/1');
        done();
    });
});

describe('url:pullRequestBadge', function(done) {
    it('should by default be https://review.ninja/:repoId/pull/:number/badge', function(done) {
        assert.equal(url.pullRequestBadge(123, 456),
                    'https://review.ninja/123/pull/456/badge');
        done();
    });
});
