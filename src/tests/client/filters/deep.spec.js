// deep test
describe('Deep Filter', function() {

    var deep;

    beforeEach(angular.mock.module('ninja.filters'));

    beforeEach(angular.mock.inject(function($filter) {
        deep = $filter('deep');
    }));

    it('should match all items', function() {

        var items = [{
            name: 'one',
            deep: {
                val: true
            }
        }, {
            name: 'two',
            deep: {
                val: true
            }
        }, {
            name: 'three',
            deep: {
                val: true
            }
        }];

        var result = deep(items, 'deep.val');

        result.length.should.equal(3);
    });

    it('should match no items', function() {

        var items = [{
            name: 'one',
            deep: {
                val: true
            }
        }, {
            name: 'two',
            deep: {
                val: true
            }
        }, {
            name: 'three',
            deep: {
                val: true
            }
        }];

        var result = deep(items, 'deep.val', false);

        result.length.should.equal(0);
    });

});
