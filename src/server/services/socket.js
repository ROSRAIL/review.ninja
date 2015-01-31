
module.exports = {
    emit: function(event, args) {

        // models
        var Milestone = require('mongoose').model('Milestone');

        var data = {action: args.action};
        var room = args.repository.owner.login + ':' + args.repository.name + ':' + event;

        var events = {
            issues: function(done) {
                data.number = args.issue.number;
                Milestone.findOne({
                    repo: args.repository.id,
                    number: args.issue.milestone ? args.issue.milestone.number : null
                }, function(err, mile) {
                    if(!err && mile) {
                        data.pull = mile.pull;
                    }
                    done(room, data);
                });
            },
            pull_request: function(done) {
                data.number = args.pull_request.number;
                done(room, data);
            },
            issue_comment: function(done) {
                data.id = args.comment.id;
                data.number = args.issue.number;
                done(room, data);
            },
            status: function(done) {
                data.sha = args.commit.sha;
                done(room, data);
            }
        };

        if(events[event]) {
            events[event](function(room, data) {
                io.emit(room, data);
            });
        }
    }
};
