// *****************************************************
// Graph Directive
// *****************************************************

module.directive('graph', function() {
    return {
        restrict: 'E',
        templateUrl: '/directives/templates/graph.html',
        scope: {
            baseSha: '=',
            issueSha: '=',
            headSha: '=',
            activeSha: '=',
            openIssues: '=',
            compare: '&'
        },
        link: function(scope, elem, attrs) {
            scope.headCommitIssues = function() {
                if(scope.openIssues) {
                    for (var i = 0; i < scope.openIssues.length; i++) {
                        if(scope.openIssues[i].sha === scope.headSha) {
                            return true;
                        }
                    }
                }
                return false;
            };
        }
    };
});
