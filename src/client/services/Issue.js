// *****************************************************
// Issue Factory
// *****************************************************

module.factory('Issue', ['$stateParams', '$HUB', function($stateParams, $HUB) {

    var regex = /\|commit\|file reference\|.*\r\n\|-+\|-+\|.*\r\n\|(\b[0-9a-f]{40}\b)\|(\[([^\|]*)?\].*?|[`]none[`])\|.*/;

    return {

        parse: function(issue) {

            var match = regex.exec(issue.body);

            if(match) {
                issue.sha = match[1];
                issue.ref = match[3];
                issue.body = issue.body.replace(match[0], '').trim();

                if(issue.sha && issue.ref) {
                    issue.key = issue.sha + '/' + issue.ref;
                }
            }

            return issue;
        },

        render: function(issue) {

            if(issue.body) {
                $HUB.wrap('markdown', 'render', {
                    text: issue.body,
                    mode: 'gfm',
                    context: $stateParams.user + '/' + $stateParams.repo
                }, function(err, markdown) {
                    if(!err) {
                        issue.html = markdown.value.body;
                    }
                });
            }

            return issue;
        }
    };
}]);
