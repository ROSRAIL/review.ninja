// *****************************************************
// Socket Factory
// *****************************************************
// Example usage:
//
// listen to event:
//
// socket.on('event-name', function(data) {
//   reaction to event
// };
//
// emit event:
//
// socket.emit('event-name', data);
//
module.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io.connect();
    return {
        on: function(eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
}]);
