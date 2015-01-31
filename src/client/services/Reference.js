// *****************************************************
// Reference Factory
// *****************************************************

module.factory('Reference', ['$stateParams', function($stateParams) {

    var regex = /([0-9a-f]{40})\/([^#]+)#L([0-9]+)-?L?([0-9]+)?/;

    var reference = function(sha, path, start, end) {
        return sha + '/' + path + '#L' + start + ((end && end !== start) ? '-L' + end : '');
    };

    var between = function(number, min, max) {
        return number >= min && number <= max;
    };

    return {
        get: function(sha, path, start, end) {
            return reference(sha, path, start, end);
        },

        select: function(sha, path, start, end) {
            if(end && end < start) {
                end = [start, start = end][0];
            }
            return {
                sha: sha,
                path: path,
                start: start,
                end: end,
                ref: reference(sha, path, start, end)
            };
        },

        starts: function(sha, path, number, ref) {
            var _sha, _path, start;
            var match = regex.exec(ref);

            if(match) {
                _sha = match[1];
                _path = match[2];
                start = parseInt(match[3], 10);
            }

            return _sha === sha && _path === path && start === number;
        },

        includes: function(sha, path, number, ref) {
            var _sha, _path, start, end;
            var match = regex.exec(ref);

            if(match) {
                _sha = match[1];
                _path = match[2];
                start = parseInt(match[3], 10);
                end = parseInt(match[4], 10);
            }

            return _sha === sha && _path === path && (start === number || between(number, start, end));
        }
    };
}]);
