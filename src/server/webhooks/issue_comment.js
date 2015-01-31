// models
var Star = require('mongoose').model('Star');
var User = require('mongoose').model('User');

//services
var github = require('../services/github');
var status = require('../services/status');
var star = require('../services/star');
var notification = require('../services/notification');

//////////////////////////////////////////////////////////////////////////////////////////////
// Github Issue comment Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function(req, res) {

    var user = req.args.repository.owner.login;
    var repo = req.args.repository.name;
    var number = req.args.issue.number;
    var sender = req.args.sender;
    var comment = req.args.comment.body;
    var repo_uuid = req.args.repository.id;

    User.findOne({ _id: req.params.id }, function(err, ninja) {

        if(err || !ninja) {
            return res.status(404).send('User not found');
        }

        var actions = {
            created: function() {

                    //
                    // Add ninja star if comment is +1 or thumbs up (:+1:)
                    //

                    if(comment.match(/(\+1)|(:\+1:)/)) {
                        github.call({
                            obj: 'pullRequests',
                            fun: 'get',
                            arg: {
                                user: user,
                                repo: repo,
                                number: number
                            },
                            token: ninja.token
                        }, function(err, pull) {
                            if(!err) {
                                star.create(pull.head.sha, user, repo, repo_uuid, number, sender, ninja.token);
                            }
                        });
                    }

                    var event = user + ':' + repo + ':' + 'issue-comment-' + req.args.issue.id;
                    io.emit(event, req.args.comment.id);
            }
        };

        if (actions[req.args.action]) {
            actions[req.args.action]();
        }

        res.end();
    });
};
