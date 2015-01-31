// *****************************************************
// Root Controller
// *****************************************************

module.controller('RootCtrl', ['$rootScope', '$scope', '$stateParams', '$HUB', '$RPC',
    function($rootScope, $scope, $stateParams, $HUB, $RPC) {

        $rootScope.user = $HUB.call('user', 'get', {});

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, error) {

            if(!($stateParams.user && $stateParams.repo)) {
                $scope.hook = {};
                return;
            }

            if(toParams.user !== fromParams.user || toParams.repo !== fromParams.repo) {
                $HUB.call('repos', 'get', {
                    user: $stateParams.user,
                    repo: $stateParams.repo
                }, function(err, repo) {
                    if(!err && repo.value.permissions.admin) {
                        $scope.hook = $RPC.call('webhook', 'get', {
                            user: $stateParams.user,
                            repo: $stateParams.repo
                        });
                    }
                });
            }
        });

        $scope.createWebhook = function() {
            $scope.creating = $RPC.call('webhook', 'create', {
                user: $stateParams.user,
                repo: $stateParams.repo,
                user_uuid: $rootScope.user.value.id
            }, function(err, hook) {
                if(!err) {
                    $scope.hook = hook;
                    $scope.created = true;
                }
            });
        };
    }
]);
