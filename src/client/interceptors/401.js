// *****************************************************
// 401 Interceptor
// *****************************************************

module.factory('401HttpResponseInterceptor', ['$q', '$location',
    function($q, $location) {
        return {
            response: function(response) {
                if (response.status === 401) {
                    window.location.href = '/auth/github?next=' + $location.path();
                    return $q.reject(response);
                }
                return response || $q.when(response);
            },
            responseError: function(rejection) {
                if (rejection.status === 401) {
                    window.location.href = '/auth/github?next=' + $location.path();
                    return $q.reject(rejection);
                }
                return $q.reject(rejection);
            }
        };
    }
])
    .config(['$httpProvider',
        function($httpProvider) {
            $httpProvider.interceptors.push('401HttpResponseInterceptor');
        }
    ]);
