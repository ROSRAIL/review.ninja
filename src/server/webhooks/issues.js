// models
var User = require('mongoose').model('User');
var Milestone = require('mongoose').model('Milestone');

//services
var url = require('../services/url');
var github = require('../services/github');
var status = require('../services/status');
var pullRequest = require('../services/pullRequest');
var notification = require('../services/notification');

//////////////////////////////////////////////////////////////////////////////////////////////
// Github Issue Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function(req, res) {

    //
    // Helper functions
    //

    function getPull(user, repo, number, token, done) {
        github.call({
            obj: 'pullRequests',
            fun: 'get',
            arg: {
                user: user,
                repo: repo,
                number: number
            },
            token: token
        }, done);
    }

    function getMilestone(user, repo, number, token, done) {
        github.call({
            obj: 'issues',
            fun: 'getMilestone',
            arg: {
                user: user,
                repo: repo,
                number: number
            },
            token: token
        }, done);
    }

    //
    // Webhook handler
    //

    var user = req.args.repository.owner.login;
    var repo = req.args.repository.name;
    var issue = req.args.issue.id;
    var sender = req.args.sender;
    var number = req.args.issue.milestone.number;
    var repo_uuid = req.args.repository.id;

    User.findOne({ _id: req.params.id }, function(err, ninja) {

        if(err || !ninja) {
            return res.status(404).send('User not found');
        }

        if(!req.args.issue.milestone) {
            return res.send('Issue has no milestone');
        }

        Milestone.findOne({
            repo: repo_uuid,
            number: number
        }, function(err, mile) {

            if(err || !mile) {
                return res.send('Milestone not found');
            }

            var actions = {
                opened: function() {

                    // update status and send an email when issue is opened
                    getPull(user, repo, mile.pull, ninja.token, function(err, pull) {
                        if(!err) {
                            status.update({
                                user: user,
                                repo: repo,
                                repo_uuid: repo_uuid,
                                sha: pull.head.sha,
                                number: pull.number,
                                token: ninja.token
                            });

                            notification.sendmail('new_issue', user, repo, repo_uuid, ninja.token, mile.pull, {
                                user: user,
                                repo: repo,
                                number: mile.pull,
                                issue: issue,
                                sender: sender,
                                url: url.reviewPullRequest(user, repo, mile.pull)
                            });
                        }
                    });
                },

                closed: function() {

                    // send a notification if all issues are closed
                    getMilestone(user, repo, number, ninja.token, function(err, milestone) {
                        if(!err && !milestone.open_issues) {
                            notification.sendmail('closed_issue', user, repo, repo_uuid, ninja.token, mile.pull, {
                                user: user,
                                repo: repo,
                                number: mile.pull,
                                issue: issue,
                                sender: sender,
                                url: url.reviewPullRequest(user, repo, mile.pull)
                            });
                        }
                    });

                    // update the status
                    getPull(user, repo, mile.pull, ninja.token, function(err, pull) {
                        if(!err) {
                            status.update({
                                user: user,
                                repo: repo,
                                repo_uuid: repo_uuid,
                                sha: pull.head.sha,
                                number: pull.number,
                                token: ninja.token
                            });
                        }
                    });
                },

                reopened: function() {

                    // update status if pull request is not merged
                    getPull(user, repo, mile.pull, ninja.token, function(err, pull) {
                        if(!err && !pull.merged) {
                            status.update({
                                user: user,
                                repo: repo,
                                repo_uuid: repo_uuid,
                                sha: pull.head.sha,
                                number: pull.number,
                                token: ninja.token
                            });
                        }
                    });
                }
            };

            if(actions[req.args.action]) {
                actions[req.args.action]();
            }

            res.end();
        });
    });
};
