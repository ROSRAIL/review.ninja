// home test
describe('Home Controller', function() {

    var scope, httpBackend, createCtrl;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.module('templates'));

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller) {

        httpBackend = $injector.get('$httpBackend');

        httpBackend.when('GET', '/config').respond({

        });

        scope = $rootScope.$new();
        $rootScope.user = {
            value: {
                login: 'login'
            }
        };
        scope.orgs = [
        {
            login:'login-1'
        },
        {
            login: 'login-2'
        },
        {
            login: 'login-3'
        }];

        scope.query = 'user/repo';

        createCtrl = function() {
            return $controller('HomeCtrl', {
                $scope: scope
            });
        };
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should load user repos propely', function() {

        var ctrl = createCtrl();

        // load the data

        httpBackend.expect('POST', '/api/user/get').respond({
            '__v': 18,
            '_id': {
                '$oid': '53f991fbee5d5ef38f67ce5f'
            },
            'repos': [
                21620444
            ],
            'token': '3004a2ac4c2055dfed8258274fb697bd8638bf32',
            'uuid': 1387834

        });

        httpBackend.expect('POST', '/api/github/call', '{"obj":"repos","fun":"one","arg":{"id":21620444}}').respond({
            data: {
                name: 'repo-1',
                user: 'me',
                ninja: true,
                uuid: 1
            }
        });

        httpBackend.flush();


        // now toggle the repo
        (scope.repos[0].name).should.be.exactly('repo-1');
    });


    it('should add a repo without error', function() {
        var ctrl = createCtrl();

        // load the data

       httpBackend.expect('POST', '/api/user/get').respond({
            '__v': 18,
            '_id': {
                '$oid': '53f991fbee5d5ef38f67ce5f'
            },
            'repos': [
                21620444
            ],
            'token': '3004a2ac4c2055dfed8258274fb697bd8638bf32',
            'uuid': 1387834

        });

        httpBackend.expect('POST', '/api/github/call', '{"obj":"repos","fun":"one","arg":{"id":21620444}}').respond({
            data: {
                id: 21620444,
                name: 'repo-1',
                user: 'me',
                ninja: true,
                uuid: 1
            }
        });

        httpBackend.flush();

        scope.add({owner:{login:'login'}, name: 'name', id: '1234'});

        httpBackend.expect('POST', '/api/user/addRepo').respond(null);
        httpBackend.flush();

        scope.repos.length.should.be.exactly(2);
    });


    it('should remove a repo without error', function() {
               var ctrl = createCtrl();

        // load the data

        httpBackend.expect('POST', '/api/user/get').respond({
            '__v': 18,
            '_id': {
                '$oid': '53f991fbee5d5ef38f67ce5f'
            },
            'repos': [
                21620444
            ],
            'token': '3004a2ac4c2055dfed8258274fb697bd8638bf32',
            'uuid': 1387834
        });

        httpBackend.expect('POST', '/api/github/call', '{"obj":"repos","fun":"one","arg":{"id":21620444}}').respond({
            data: {
                name: 'repo-1',
                user: 'me',
                ninja: true,
                uuid: 1
            }
        });

        httpBackend.flush();


        scope.remove({owner:{login:'login'}, name: 'name', id: '1234'});

        httpBackend.expect('POST', '/api/user/rmvRepo').respond(null);

        httpBackend.flush();

        (scope.repos[0].name).should.be.exactly('repo-1');

    });


    it('should search for repo', function() {

        var ctrl = createCtrl();

        // load the data

        httpBackend.expect('POST', '/api/user/get').respond({
            '__v': 18,
            '_id': {
                '$oid': '53f991fbee5d5ef38f67ce5f'
            },
            'repos': [
                21620444
            ],
            'token': '3004a2ac4c2055dfed8258274fb697bd8638bf32',
            'uuid': 1387834
        });

        httpBackend.expect('POST', '/api/github/call', '{"obj":"repos","fun":"one","arg":{"id":21620444}}').respond({
            data: {
                name: 'repo-1',
                user: 'me',
                ninja: true,
                uuid: 1
            }
        });


        httpBackend.flush();

        scope.search();

        var repos = ['repo-1', 'repo-2'];

        httpBackend.expect('POST', '/api/github/wrap','{"obj":"search","fun":"repos","arg":{"q":"repo+in:name+fork:true+user:user"}}').respond({
            data: 'repos'
        });

        httpBackend.flush();

        (scope.results.length).should.be.exactly(5);

    });

});
