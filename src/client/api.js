'use strict';

// *****************************************************
// API
// *****************************************************

function ResultSet() {

    this.loaded = false;
    this.loading = true;

}

ResultSet.prototype.set = function(error, value) {

    this.loaded = true;
    this.loading = false;

    this.error = error;
    this.affix = value;
    this.value = (this.value instanceof Array && value instanceof Array) ? this.value.concat(value) : value;

};


module.factory('$RAW', ['$http',
    function($http) {
        return {
            call: function(m, f, d, c) {
                var now = new Date();
                return $http.post('/api/' + m + '/' + f, d)
                    .success(function(res) {
                        // parse result (again)
                        try {
                            res = JSON.parse(res);
                        } catch (ex) {}
                        // yield result
                        c(null, res, new Date() - now);
                    })
                    .error(function(res) {
                        c(res, null, new Date() - now);
                    });
            }
        };
    }
]);


module.factory('$RPC', ['$RAW', '$log',
    function($RAW, $log) {

        return {
            call: function(m, f, d, c) {
                var res = new ResultSet();
                $RAW.call(m, f, d, function(error, value) {
                    res.set(error, value);
                    $log.debug('$RPC', m, f, d, res, res.error);
                    if (typeof c === 'function') {
                        c(res.error, res);
                    }
                });
                return res;
            }
        };
    }
]);


module.factory('$HUB', ['$RAW', '$log',
    function($RAW, $log) {

        var exec = function(type, res, args, call) {
            $RAW.call('github', type, args, function(error, value) {

                var data = value ? value.data : null;
                var meta = value ? value.meta : null;

                res.set(error, data);

                if(meta) {

                    res.meta = meta;

                    res.hasMore = meta.hasMore;

                    res.getMore = meta.hasMore ? function() {

                        res.loaded = false;
                        res.loading = true;
                        args.arg.page = args.arg.page + 1 || 2;

                        exec(type, res, args, call);

                    } : null;
                }

                $log.debug('$HUB', args, res, res.error);

                if (typeof call === 'function') {
                    call(res.error, res);
                }
            });
            return res;
        };

        return {
            call: function(o, f, d, c) {
                return exec('call', new ResultSet(), { obj: o, fun: f, arg: d }, c);
            },
            wrap: function(o, f, d, c) {
                return exec('wrap', new ResultSet(), { obj: o, fun: f, arg: d }, c);
            }
        };
    }


]);


// *****************************************************
// Angular Route Provider Resolve Promises
// *****************************************************


module.factory('$HUBService', ['$q', '$HUB',
    function($q, $HUB) {

        var exec = function(type, o, f, d, c, p) {
            var deferred = $q.defer();
            $HUB[type](o, f, d, function(err, obj) {
                if (typeof c === 'function') {
                    c(err, obj);
                }
                if(!err || p) {
                    deferred.resolve(obj);
                }
                return deferred.reject();
            });
            return deferred.promise;
        };

        return {
            call: function(o, f, d, c, p) {
                return exec('call', o, f, d, c, p);
            },
            wrap: function(o, f, d, c, p) {
                return exec('wrap', o, f, d, c, p);
            }
        };
    }
]);


// *****************************************************
// Angular Route Provider Resolve Promises
// *****************************************************


module.factory('$RPCService', ['$q', '$RPC',
    function($q, $RPC) {
        return {
            call: function(o, f, d, c, p) {
                var deferred = $q.defer();
                $RPC.call(o, f, d, function(err, obj) {
                    if (typeof c === 'function') {
                        c(err, obj);
                    }
                    if(!err || p) {
                        deferred.resolve(obj);
                    }
                    return deferred.reject();
                });
                return deferred.promise;
            }
        };
    }
]);
