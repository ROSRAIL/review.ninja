// unit test
var assert = require('assert');
var sinon = require('sinon');

var nodemailer = require('nodemailer');
var ejs = require('ejs');
var fs = require('fs');

// config
global.config = require('../../../config');

// service
var notification = require('../../../server/services/notification');
var github = require('../../../server/services/github');
var Settings = require('mongoose').model('Settings');
var User = require('mongoose').model('User');
var pullRequest = require('../../../server/services/pullRequest');

describe('notification:', function() {
    it('should render the email content for new_issue', function(done) {
        var expectedcontent = '<h1>ReviewNinja</h1>\n\n\nA new issue has been raised for <a href="testurl">testuser/testrepo #1</a> by testsenderlogin.\n\n<p>--</p>\n<p>Automatic notification by ReviewNinja.<br>\nVisit <a href="http://www.review.ninja">review.ninja</a> to hear more about review.ninja.</p>\n\n';

        var filename = 'src/server/templates/new_issue.ejs';
        var template = fs.readFileSync(filename, 'utf-8');
        var content = ejs.render(template, {
            filename: filename,
            url: 'testurl',
            user: 'testuser',
            repo: 'testrepo',
            number: 1,
            sender: {
                login: 'testsenderlogin'
            }
        });

        assert.equal(content, expectedcontent, 'Rendered content of email template for "new issue" wrong');

        done();
    });

    it('should send an email', function(done) {
        var collaborators = [];
        collaborators.push({
            uuid: 'collaboratoruuid'
        });
        var githubStub = sinon.stub(github, 'call', function(arg, fun) {
            if(arg.obj === 'pullRequests' && arg.fun === 'get') {
                var pull = {};
                pull.state = 'open';
                fun(null, pull);
            } else if(arg.obj === 'repos' && arg.fun === 'getCollaborators') {
                fun(null, collaborators);
            } else if(arg.obj === 'user' && arg.fun === 'getEmails') {
                fun(null, [
                    {primary: 'test@testmail.de'}
                ]);
            }
        });
        var settingsStub = sinon.stub(Settings, 'findOne', function(arg, fun) {
            fun(null, {
                watched: true,
                notifications: {
                    star: 'star'
                }
            });
        });
        var pullRequestStub = sinon.stub(pullRequest, 'isWatched').returns(true);
        var userStub = sinon.stub(User, 'find').returns({where: function(uuid) {
            return {
                in: function(collaboratorIds) {
                    return {
                        exec: function(fun) {
                            fun(null, collaborators);
                        }
                    };
                }
            };
        }});
        var transporter = {
            sendMail: sinon.spy()
        };
        var nodemailerStub = sinon.stub(nodemailer, 'createTransport').returns(transporter);

        notification.sendmail('star', 'ninja', 'reviewninja', '123', '456', 789, {
            sender: {
                id: 'senderid',
                login: 'senderlogin'
            },
            url: 'testurl',
            number: 'testnumber',
            repo: 'testrepo',
            user: 'testuser'
        });


        assert(nodemailer.createTransport.called, 'transporter not created');
        assert(transporter.sendMail.called, 'mail not send via transporter');

        githubStub.restore();
        settingsStub.restore();
        pullRequestStub.restore();
        userStub.restore();
        nodemailerStub.restore();

        done();
    });
});
