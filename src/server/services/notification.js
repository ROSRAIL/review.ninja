var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var sendmailTransport = require('nodemailer-sendmail-transport');
var fs = require('fs');
var ejs = require('ejs');
var github = require('./github');
var pullRequest = require('./pullRequest');

var Settings = require('mongoose').model('Settings');
var User = require('mongoose').model('User');

module.exports = function() {

    function buildTransporter() {
        if(config.server.smtp.enabled) {
            return nodemailer.createTransport(smtpTransport(config.server.smtp));
        }
        return nodemailer.createTransport(sendmailTransport());
    }

    function getCollaborators(user, repo, token, done) {
        github.call({
            obj: 'repos',
            fun: 'getCollaborators',
            arg: {
                user: user,
                repo: repo
            },
            token: token
        }, function(err, collaborators) {
            if(err) {
                return done(err);
            }

            var collaboratorIds = collaborators.map(function(collaborator) {
                return collaborator.id;
            });

            User.find().where('uuid').in(collaboratorIds).exec(function(err, collaborators) {
                done(err, collaborators);
            });
        });
    }

    function getPullRequest(pullReqNumber, user, repo, token, done) {
        github.call({
            obj: 'pullRequests',
            fun: 'get',
            arg: {
                user: user,
                repo: repo,
                number: pullReqNumber
            },
            token: token
        }, function(err, pull) {
            done(err, pull);
        });
    }

    function getPrimaryEmail(token, done) {
        github.call({
            obj: 'user',
            fun: 'getEmails',
            arg : {
                headers: {
                    'accept': 'application/vnd.github.v3+json'
                }
            },
            token: token
        }, function(err, emails) {
            var primary = null;
            if(!err) {
                for(var key = 0; key < emails.length; key++) {
                    if(emails[key].primary) {
                        primary = emails[key];
                        break;
                    }
                }
            }
            done(err, primary);
        });
    }

    var eventType = {
        pull_request_opened: 'pull_request',
        pull_request_synchronized: 'pull_request',
        star: 'star',
        unstar: 'star',
        new_issue: 'issue',
        closed_issue: 'issue'
    };

    var notificationArgs = {

        pull_request_opened: {
            subject:'A new pull request is ready for review',
            template:'src/server/templates/pullReqOpened.ejs'
        },

        pull_request_synchronized: {
            subject:  'New commits added to pull request',
            template: 'src/server/templates/pullReqSync.ejs'
        },

        star: {
            subject: 'Pull request has been starred',
            template: 'src/server/templates/starred.ejs'
        },

        unstar: {
            subject: 'Pull request has been unstarred',
            template: 'src/server/templates/unstarred.ejs'
        },

        new_issue: {
            subject: 'A new issue has been raised',
            template: 'src/server/templates/new_issue.ejs'
        },

        closed_issue: {
            subject: 'All issues have been closed',
            template: 'src/server/templates/issue_closed.ejs'
        }

    };

    return {
        sendmail: function (notificationType, user, repo, repoUuid, token, number, args) {
            getPullRequest(number, user, repo, token, function(err, pull) {
                if(err) {
                    return;
                }

                if(pull.state !== 'open') {
                    return;
                }

                getCollaborators(user, repo, token, function(err, collaborators) {
                    if(err) {
                        return;
                    }

                    collaborators.forEach(function(collaborator){
                        getPrimaryEmail(collaborator.token, function(err, email) {
                            if(err || !email) {
                                return;
                            }

                            Settings.findOne({
                                user: collaborator.uuid,
                                repo: repoUuid
                            }, function(err, settings) {
                                if(err || !settings || !settings.watched) {
                                    return;
                                }

                                if( pullRequest.isWatched(pull, settings) &&
                                    settings.notifications[eventType[notificationType]] &&
                                    args.sender && args.sender.id !== collaborator.uuid ) {
                                    var transporter = buildTransporter();
                                    var template = fs.readFileSync(notificationArgs[notificationType].template, 'utf-8');
                                    args.filename = notificationArgs[notificationType].template;

                                    var mailOptions = {
                                        from: 'ReviewNinja <noreply@review.ninja>',
                                        to: email.email,
                                        subject: notificationArgs[notificationType].subject,
                                        html: ejs.render(template, args)
                                    };

                                    transporter.sendMail(mailOptions, function(err, response) {
                                        if (err) {
                                            return;
                                        }

                                        transporter.close();
                                    });
                                }
                            });
                        });
                    });
                });
            });
        }
    };
}();
