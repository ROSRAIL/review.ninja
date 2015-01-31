// module
var url = require('../services/url');
var github = require('../services/github');
var milestone = require('../services/milestone');
var keenio = require('../services/keenio');

module.exports = {

/************************************************************************************************************

    @github

    + issues.create

************************************************************************************************************/

    add: function(req, done) {
        if(!req.args.sha) {
            return done({
                code: 400,
                text: 'sha must be set'
            }, null);
        }
        if(!req.args.user) {
            return done({
                code: 400,
                text: 'user must be set'
            }, null);
        }
        if(!req.args.repo) {
            return done({
                code: 400,
                text: 'repo must be set'
            }, null);
        }
        if(!req.args.repo_uuid) {
            return done({
                code: 400,
                text: 'repo_uuid must be set'
            }, null);
        }
        if(!req.args.title) {
            return done({
                code: 400,
                text: 'title must be set'
            }, null);
        }
        if(!req.args.number) {
            return done({
                code: 400,
                text: 'number must be set'
            }, null);
        }

        var fileReference = '`none`';

        var ninjaReference = '[![#' + req.args.number + ']' + '(' + url.baseUrl + '/assets/images/icon-alt-36.png' + ')]' + '(' + url.reviewPullRequest(req.args.user, req.args.repo, req.args.number) + ')';

        if(req.args.reference) {
            var referenceUrl = url.githubFileReference(req.args.user, req.args.repo, req.args.reference);
            // req.args.reference is 'sha/path/to/file#Lline_number this line trims the sha
            fileReference = '[' + req.args.reference.replace(req.args.sha + '/', '') + ']' + '(' + referenceUrl + ')';
        }

        var body = req.args.body + '\r\n\r\n';
        body += '|commit|file reference|pull request|   |\r\n';
        body += '|------|--------------|------------|---|\r\n';
        body += '|' + req.args.sha + '|' + fileReference + '| #' + req.args.number + ' |' + ninjaReference + '|';

        milestone.get(req.args.user, req.args.repo, req.args.repo_uuid, req.args.number, req.user.token,
            function(err, milestone) {
                if(err) {
                    return done(err);
                }

                github.call({
                    obj: 'issues',
                    fun: 'create',
                    arg: {
                        user: req.args.user,
                        repo: req.args.repo,
                        body: body,
                        title: req.args.title,
                        labels: ['review.ninja'],
                        milestone: milestone.number
                    },
                    token: req.user.token
                }, function(err, obj) {
                    if (!err) {
                        keenio.addEvent('AddIssue', {
                            user: req.args.user,
                            repo: req.args.repo,
                            body: body,
                            title: req.args.title,
                            labels: ['review.ninja'],
                            milestone: milestone.number
                        });
                    }
                    done(err, obj);
                });
            }
        );
    }
};
