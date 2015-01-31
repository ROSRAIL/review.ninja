// *****************************************************
// Pluralize filter
//
// examples:
// {{ 1 | pluralize:'guy' }} -> 1 guy
// {{ 3 | pluralize:'guy' }} -> 3 guys
// {{ 1 | pluralize:'person':'people' }} -> 1 person
// {{ 3 | pluralize:'person':'people' }} -> 3 people
// *****************************************************

filters.filter('pluralize', function() {
    return function(value, singular, plural) {

        var pluralized;

        if (value !== 1) {
            pluralized = plural ? plural : singular + 's';
        }

        return value + ' ' + (pluralized || singular);
    };
});
