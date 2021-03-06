// *****************************************************
// Pull Factory
// *****************************************************

module.factory('Pull', ['$HUB', '$RPC', '$stateParams', function($HUB, $RPC, $stateParams) {

    return {

        milestone: function(pull) {
            if(pull.milestone) {
                $HUB.call('issues', 'getMilestone', {
                    user: pull.base.repo.owner.login,
                    repo: pull.base.repo.name,
                    number: pull.milestone.number
                }, function(err, milestone) {
                    if(!err) {
                        pull.milestone = milestone.value;
                    }
                });
            }
            return pull;
        },

        render: function(pull) {
            if(pull.body) {
                $HUB.wrap('markdown', 'render', {
                    text: pull.body,
                    mode: 'gfm',
                    context: $stateParams.user + '/' + $stateParams.repo
                }, function(err, markdown) {
                    if(!err) {
                        pull.html = markdown.value.body;
                    }
                });
            }
            return pull;
        },

        stars: function(pull) {
            $RPC.call('star', 'all', {
                sha: pull.head.sha,
                repo_uuid: pull.base.repo.id
            }, function(err, stars) {
                if(!err) {
                    pull.stars = stars.value;
                    pull.stars.forEach(function(star) {
                        star.user = $HUB.call('user', 'getFrom', {
                            user: star.name
                        });
                    });
                }
            });
            return pull;
        },

        commentsCount: function(pull) {
            $HUB.call('issues', 'getComments', {
                user: $stateParams.user,
                repo: $stateParams.repo,
                number: pull.number,
                per_page: 10
            }, function(err, comments) {
                if(!err) {
                    pull.commentsCount = comments.value.length < 10 ? comments.value.length : comments.value.length + '+';
                }
            });
            return pull;
        }
    };
}]);
