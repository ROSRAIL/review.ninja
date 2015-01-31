// *****************************************************
// File Browser Directive
// *****************************************************

module.directive('browser', ['$stateParams', '$HUB', '$RPC', 'File',
    function($stateParams, $HUB, $RPC, File) {
        return {
            restrict: 'E',
            templateUrl: '/directives/templates/browser.html',
            scope: {
                sha: '=',
                issues: '=',
                selection: '=',
                refIssues: '='
            },
            link: function(scope, elem, attrs) {

                scope.$watch('sha', function(sha) {
                    if(sha) {
                        scope.stack = [];
                        scope.path = [];
                        $HUB.call('gitdata', 'getTree', {
                            user: $stateParams.user,
                            repo: $stateParams.repo,
                            sha: sha
                        }, function(err, tree) {
                            if(!err) {
                                scope.tree = File.getTreeTypes(tree.value);
                            }
                        });
                    }
                });

                scope.up = function() {
                    if(scope.stack.length) {
                        scope.file = null;
                        scope.path.pop();
                        scope.tree = scope.stack.pop();
                    }
                };

                scope.down = function(node, sha) {
                    if(node.type === 'tree') {
                        $HUB.call('gitdata', 'getTree', {
                            user: $stateParams.user,
                            repo: $stateParams.repo,
                            sha: node.sha
                        }, function(err, tree) {
                            if(!err) {
                                scope.path.push(node.path);
                                scope.stack.push(scope.tree);
                                scope.tree = File.getTreeTypes(tree.value);
                            }
                        });
                    } else {
                        $HUB.wrap('gitdata', 'getBlob', {
                            user: $stateParams.user,
                            repo: $stateParams.repo,
                            sha: node.sha
                        }, function(err, res) {
                            if(!err) {
                                scope.path.push(node.path);
                                scope.stack.push(scope.tree);
                                scope.file = res.value;
                            }
                        });
                    }
                };
            }
        };
    }
]);
