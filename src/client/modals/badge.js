module.controller('BadgeCtrl', ['$scope', '$modalInstance', '$window',
    function($scope, $modalInstance, $window) {

        $scope.origin = $window.location.origin;

        $scope.ok = function() {
            $modalInstance.dismiss();
        };
    }
]);
