var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var sendmailTransport = require('nodemailer-sendmail-transport');
var fs = require('fs');
var ejs = require('ejs');
var github = require('./github');
var pullRequest = require('./pullRequest');
var url = require('./url');

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
            template:'src/server/templates/pullReqOpened.ejs',
            imageurl: url.baseUrl + '/assets/images/email_pullrequest.png'
        },

        pull_request_synchronized: {
            subject:  'New commits added to pull request',
            template: 'src/server/templates/pullReqSync.ejs',
            imageurl: url.baseUrl + '/assets/images/email_pullrequest.png'
        },

        star: {
            subject: 'Pull request has been starred',
            template: 'src/server/templates/starred.ejs',
            imageurl: url.baseUrl + '/assets/images/email_starr.png'
        },

        unstar: {
            subject: 'Pull request has been unstarred',
            template: 'src/server/templates/unstarred.ejs',
            imageurl: url.baseUrl + '/assets/images/email_unstarr.png'
        },

        new_issue: {
            subject: 'A new issue has been opened',
            template: 'src/server/templates/new_issue.ejs',
            imageurl: url.baseUrl + '/assets/images/email_issue_opened.png'
        },

        closed_issue: {
            subject: 'All issues have been closed',
            template: 'src/server/templates/issue_closed.ejs',
            imageurl: url.baseUrl + '/assets/images/email_issue_closed.png'
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
                                    var textTemplate = fs.readFileSync(notificationArgs[notificationType].template, 'utf-8');
                                    args.pullrequestname = pull.title;
                                    args.actionText = ejs.render(textTemplate, args);
                                    args.icon = notificationArgs[notificationType].imageurl;
                                    args.baseUrl = url.baseUrl;

                                    var emailTemplate = fs.readFileSync('src/server/templates/notification.ejs', 'utf-8');

                                    var mailOptions = {
                                        from: 'ReviewNinja <noreply@review.ninja>',
                                        to: email.email,
                                        subject: notificationArgs[notificationType].subject,
                                        html: ejs.render(emailTemplate, args)
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
