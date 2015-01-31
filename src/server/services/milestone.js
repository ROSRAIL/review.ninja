// models
var Milestone = require('mongoose').model('Milestone');

// modules
var github = require('../services/github');

module.exports = {

    get: function(user, repo, repo_uuid, number, token, done) {
        Milestone.findOne({
            pull: number,
            repo: repo_uuid
        }, function(err, milestone) {

            if(err) {
                return done(err);
            }

            // check if milestone still exists
            github.call({
                obj: 'issues',
                fun: 'getMilestone',
                arg: {
                    user: user,
                    repo: repo,
                    number: milestone ? milestone.number : null
                },
                token: token
            }, function(err) {
                if(!err) {
                    return done(err, milestone);
                }

                // create milestone if non-existant
                github.call({
                    obj: 'issues',
                    fun: 'createMilestone',
                    arg: {
                        user: user,
                        repo: repo,
                        title: config.milestone_prefix + 'ReviewNinja PR #' + number
                    },
                    token: token
                }, function(err, milestone) {
                    if(err) {
                        return done(err);
                    }

                    Milestone.findOneAndUpdate({
                        pull: number,
                        repo: repo_uuid
                    }, {
                        number: milestone.number
                    }, {
                        upsert: true
                    }, done);
                });
            });
        });
    },

    close: function(user, repo, repo_uuid, number, token) {
        Milestone.findOne({
            pull: number,
            repo: repo_uuid
        }, function(err, milestone) {
            if(!err && milestone) {
                github.call({
                    obj: 'issues',
                    fun: 'getMilestone',
                    arg: {
                        user: user,
                        repo: repo,
                        number: milestone.number
                    },
                    token: token
                }, function(err, milestone) {
                    if(!err) {
                        github.call({
                            obj: 'issues',
                            fun: 'updateMilestone',
                            arg: {
                                user: user,
                                repo: repo,
                                number: milestone.number,
                                title: milestone.title,
                                state: 'closed'
                            },
                            token: token
                        });
                    }
                });
            }
        });
    }
};
