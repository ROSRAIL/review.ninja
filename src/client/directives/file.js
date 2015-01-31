// *****************************************************
// File Directive
// *****************************************************

module.directive('file', ['$state', '$filter', '$stateParams', 'Reference', function($state, $filter, $stateParams, Reference) {
        return {
            restrict: 'E',
            templateUrl: '/directives/templates/file.html',
            scope: {
                path: '=',
                issues: '=',
                content: '=',
                headSha: '=',
                selection: '=',
                refIssues: '='
            },
            link: function(scope, elem, attrs) {

                //
                // Actions
                //

                scope.clear = function() {
                    scope.selection = {};
                };

                scope.selStarts = function(line) {
                    return Reference.starts(scope.headSha, scope.path, line.base, scope.selection.ref);
                };

                scope.isSelected = function(line) {
                    return Reference.includes(scope.headSha, scope.path, line.base, scope.selection.ref);
                };

                scope.refStarts = function(line) {
                    var match = false;
                    if(scope.issues) {
                        $filter('filter')(scope.issues, {number: $stateParams.issue}).forEach(function(issue) {
                            match = match || Reference.starts(scope.headSha, scope.path, line.base, issue.key);
                        });
                    }
                    return match;
                };

                scope.isReferenced = function(line) {
                    var match = false;
                    if(scope.issues) {
                        $filter('filter')(scope.issues, {number: $stateParams.issue}).forEach(function(issue) {
                            match = match || Reference.includes(scope.headSha, scope.path, line.base, issue.key);
                        });
                    }
                    return match;
                };

                scope.select = function(line, event) {
                    if(line.base) {
                        var shift = scope.selection.start && event.shiftKey && scope.path === scope.selection.path;
                        var start = !shift ? line.base : scope.selection.start;
                        var end = shift ? line.base : null;
                        scope.selection = Reference.select(scope.headSha, scope.path, start, end);
                    }
                };

                scope.go = function(line) {
                    var issues = [];

                    scope.issues.forEach(function(issue) {
                        if(Reference.starts(scope.headSha, scope.path, line.base, issue.key)) {
                            issues.push(issue.number);
                        }
                    });

                    if(issues.length === 1) {
                        return $state.go('repo.pull.issue.detail', { issue: issues[0] });
                    }

                    scope.refIssues = issues;
                };
            }
        };
    }
]);
