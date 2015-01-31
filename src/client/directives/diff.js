// *****************************************************
// Diff File Directive
// *****************************************************

module.directive('diff', ['$stateParams', '$state', '$HUB', '$RPC', 'Reference', '$filter',
    function($stateParams, $state, $HUB, $RPC, Reference, $filter) {
        return {
            restrict: 'E',
            templateUrl: '/directives/templates/diff.html',
            scope: {
                file: '=',
                issues: '=',
                baseSha: '=',
                headSha: '=',
                selection: '=',
                refIssues: '='
            },
            link: function(scope, elem, attrs) {

                scope.open = !scope.file.ignored;
                scope.expanded = false;

                //
                // Expand the diff
                //

                scope.$watch('file.patch', function(patch) {
                    if(patch && patch.length && !scope.file.image) {
                        $HUB.wrap('gitdata', 'getBlob', {
                            user: $stateParams.user,
                            repo: $stateParams.repo,
                            sha: scope.file.sha
                        }, function(err, blob) {
                            if(!err) {

                                var file = [], chunks = [];
                                var index = 0;

                                // find the chunks
                                while (index < scope.file.patch.length) {
                                    if(scope.file.patch[index].chunk) {
                                        var start = 0, end = 0, c = [];
                                        while( ++index < scope.file.patch.length && !scope.file.patch[index].chunk ) {
                                            start = start ? start : scope.file.patch[index].head;
                                            end = scope.file.patch[index].head ? scope.file.patch[index].head : end;
                                            c.push(scope.file.patch[index]);
                                        }

                                        chunks.push({ start:start, end:end, chunk:c });
                                        continue;
                                    }
                                    index = index + 1;
                                }

                                index = 0;

                                // insert the chunks
                                while (index < blob.value.content.length) {
                                    if( chunks[0] && blob.value.content[index].head === chunks[0].start ) {
                                        chunk = chunks.shift();
                                        file = file.concat( chunk.chunk );
                                        index = chunk.end;
                                        continue;
                                    }

                                    file.push( blob.value.content[index] );
                                    index = index + 1;
                                }

                                // set the file
                                scope.file.file = file;
                            }

                        });
                    }

                });

                //
                // Actions
                //

                scope.clear = function() {
                    scope.selection = {};
                };

                scope.selStarts = function(line) {
                    return Reference.starts(scope.headSha, scope.file.filename, line.head, scope.selection.ref);
                };

                scope.isSelected = function(line) {
                    return Reference.includes(scope.headSha, scope.file.filename, line.head, scope.selection.ref);
                };

                scope.refStarts = function(line) {
                    var match = false;
                    if(scope.issues) {
                        $filter('filter')(scope.issues, {number: $stateParams.issue}).forEach(function(issue) {
                            match = match || Reference.starts(scope.baseSha, scope.file.filename, line.base, issue.key) || Reference.starts(scope.headSha, scope.file.filename, line.head, issue.key);
                        });
                    }
                    return match;
                };

                scope.isReferenced = function(line) {
                    var match = false;
                    if(scope.issues) {
                        $filter('filter')(scope.issues, {number: $stateParams.issue}).forEach(function(issue) {
                            match = match || Reference.includes(scope.baseSha, scope.file.filename, line.base, issue.key) || Reference.includes(scope.headSha, scope.file.filename, line.head, issue.key);
                        });
                    }
                    return match;
                };

                scope.select = function(line, event) {
                    if(line.head) {
                        var shift = scope.selection.start && event.shiftKey && scope.file.filename === scope.selection.path;
                        var start = !shift ? line.head : scope.selection.start;
                        var end = shift ? line.head : null;
                        scope.selection = Reference.select(scope.headSha, scope.file.filename, start, end);
                    }
                };

                scope.go = function(line) {
                    var issues = [];

                    scope.issues.forEach(function(issue) {
                        if(Reference.starts(scope.baseSha, scope.file.filename, line.base, issue.key) || Reference.starts(scope.headSha, scope.file.filename, line.head, issue.key)) {
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
