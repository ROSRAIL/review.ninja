// *****************************************************
// Focus Directive
// *****************************************************

module.directive('focus', ['$timeout', function($timeout) {
    return {
        link: function(scope, elem, attr) {
            scope.$watch(attr.focus, function(value) {
                if(value === true) {
                    $timeout(function() {
                        elem[0].focus();
                        scope[attr.focus] = false;
                    });
                }
            });
        }
    };
}]);
