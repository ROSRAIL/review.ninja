// *****************************************************
// Home Controller
//
// tmpl: home.html
// path: /
// *****************************************************

module.controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$HUB', '$RPC',
    function($rootScope, $scope, $state, $stateParams, $HUB, $RPC) {

        $scope.repos = [];

        $scope.results = [];

        $scope.hasRepos = true;

        $RPC.call('user', 'get', {}, function(err, user) {
            if(!err) {

                $scope.hasRepos = !!user.value.repos.length;

                user.value.repos.forEach(function(uuid) {
                    $HUB.call('repos', 'one', {
                        id: uuid
                    }, function(err, repo) {
                        if(!err) {
                            repo.value.ninja = true;
                            $scope.repos.push(repo.value);
                        }
                    });
                });
            }
        });

        //
        // Actions
        //

        $scope.add = function(repo) {
            $RPC.call('user', 'addRepo', {
                user: repo.owner.login,
                repo: repo.name,
                repo_uuid: repo.id
            }, function(err) {
                $scope.active = null;
                $scope.hasRepos = true;
                if(!err && $scope.repos.indexOf(repo) < 0) {
                    repo.ninja = true;
                    repo.adddate = -new Date();
                    $scope.repos.push(repo);

                    $scope.reset();
                }
            });
        };

        $scope.remove = function(repo) {
            $RPC.call('user', 'rmvRepo', {
                user: repo.owner.login,
                repo: repo.name,
                repo_uuid: repo.id
            }, function(err) {
                if(!err) {
                    repo.ninja = false;
                }
            });
        };

        $scope.search = function() {

            // clear results
            $scope.results = [];

            // get query
            var query = $scope.query.split('/');
            query = (query[1] || '') + '+in:name+fork:true+user:' + query[0];

            $scope.searching = $HUB.wrap('search', 'repos', {
                q: query
            }, function(err, repos) {
                if(!err) {
                    $scope.results = repos.value;
                }
            });
        };

        $scope.reset = function() {
            $scope.query = null;
            $scope.results = [];
        };
    }
]);
