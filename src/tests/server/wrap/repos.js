// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// io
global.io = {emit: function() {}};

// models
var User = require('../../../server/documents/user').User;

// wrap
var repos = require('../../../server/wrap/repos');

describe('repos:getCollaborators', function() {
    it('should flag all collaborators if they are a user of reviewninja', function(done) {
        var collaboratorRegistered = {
            id: 1
        };
        var collaboratorUnknown = {
            id: 2
        };
        var collaborators = [collaboratorRegistered, collaboratorUnknown];

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            if(args.uuid === collaboratorRegistered.id) {
                return done(null, collaboratorRegistered);
            }
            return done(null, null);
        });

        var req = {
            obj: 'repos',
            fun: 'getCollaborators',
            arg: {
                user: 'reviewninja',
                repo: 'foo'
            }
        };

        repos.getCollaborators(req, collaborators, function(err, collaborators) {
            assert.equal(null, err);
            assert.equal(1, collaborators[0].id);
            assert.equal(true, collaborators[0].ninja);
            assert.equal(2, collaborators[1].id);
            assert.equal(false, collaborators[1].ninja);

            userStub.restore();
            done();
        });
    });
});