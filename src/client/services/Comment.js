// *****************************************************
// Pull Factory
// *****************************************************

module.factory('Comment', ['$HUB', '$stateParams', function($HUB, $stateParams) {

    return {

        render: function(comment) {

            if(comment.body) {
                $HUB.wrap('markdown', 'render', {
                    text: comment.body,
                    mode: 'gfm',
                    context: $stateParams.user + '/' + $stateParams.repo
                }, function(err, markdown) {
                    if(!err) {
                        comment.html = markdown.value.body;
                    }
                });
            }

            return comment;
        }
    };
}]);
