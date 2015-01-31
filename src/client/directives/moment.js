// *****************************************************
// Moment Directive
// *****************************************************

module.directive('moment', function($timeout) {
    return {
        restrict: 'A',
        scope: {
            moment: '='
        },
        link: function(scope, element, attr) {
            var fun = attr.display || 'fromNow';
            scope.$watch('moment', function(newValue, oldValue) {
                if (newValue) {
                    var refresh = function() {
                        element.html(moment(newValue)[fun]());
                        $timeout(refresh, 60000);
                    };
                    refresh();
                } else {
                    element.html('');
                }
            });
        }
    };
});
