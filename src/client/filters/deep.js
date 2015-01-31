// *****************************************************
// Deep filter
// *****************************************************

filters.filter('deep', function() {
    return function(items, property, target) {

        if(target === null) {
            return items;
        }

        var matched = [];

        var properties = property.split('.');

        items = items instanceof Array ? items : [];

        target = typeof target !== 'undefined' ? target : true;

        items.forEach(function(item) {

            var value = item;

            try {
                properties.forEach(function(property) {
                    value = value[property];
                });
            } catch (ex) {
                value = undefined;
            }

            if (value === target) {
                matched.push(item);
            }
        });

        return matched;
    };
});
