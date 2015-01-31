// *****************************************************
// In filter
// *****************************************************

filters.filter('in', function() {
    return function(items, array, attr) {

        if(!array || !array.length) {
            return items;
        }

        var matched = [];
        items.forEach(function(item) {
            if(array.indexOf(item[attr] || item) > -1) {
                matched.push(item);
            }
        });

        return matched;
    };
});
