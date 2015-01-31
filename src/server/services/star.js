var Star = require('mongoose').model('Star');

var url = require('./url');
var github = require('./github');
var status = require('../services/status');
var notification = require('../services/notification');

module.exports = {

    create: function(sha, user, repo, repo_uuid, number, sender, token, done) {
        Star.create({
            sha: sha,
            user: sender.id,
            repo: repo_uuid,
            name: sender.login,
            created_at: Date.now()
        }, function(err, star) {
            if(!err && star) {
                io.emit(user + ':' + repo + ':' + 'pull_request', {action: 'starred', number: number});
                status.update({
                    user: user,
                    repo: repo,
                    sha: sha,
                    repo_uuid: repo_uuid,
                    number: number,
                    token: token
                });
                notification.sendmail('star', user, repo, repo_uuid, token, number, {
                    user: user,
                    repo: repo,
                    number: number,
                    sender: sender,
                    url: url.reviewPullRequest(user, repo, number)
                });
            }

            if(typeof done === 'function') {
                done(err, star);
            }
        });
    },

    remove: function(sha, user, repo, repo_uuid, number, sender, token, done) {
        Star.findOne({
            sha: sha,
            user: sender.id,
            repo: repo_uuid
        }, function(err, star) {
            if(err || !star){
                return done(err, star);
            }

            star.remove(function(err, star) {
                if(!err && star) {
                    io.emit(user + ':' + repo + ':' + 'pull_request', {action: 'unstarred', number: number});
                    status.update({
                        user: user,
                        repo: repo,
                        sha: sha,
                        repo_uuid: repo_uuid,
                        number: number,
                        token: token
                    });
                    notification.sendmail('unstar', user, repo, repo_uuid, token, number, {
                        user: user,
                        repo: repo,
                        number: number,
                        sender: sender,
                        url: url.reviewPullRequest(user, repo, number)
                    });
                }

                done(err, star);
            });
        });
    }
};
