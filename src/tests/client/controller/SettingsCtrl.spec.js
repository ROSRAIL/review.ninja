// settings test
describe('Settings Controller', function() {

    var scope, repo, httpBackend, createCtrl;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.module('templates'));

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller) {

        httpBackend = $injector.get('$httpBackend');

        httpBackend.when('GET', '/config').respond({

        });
        scope = $rootScope.$new();

        repo = {
            value: {
                id:1234
            }
        };
        createCtrl = function() {

            var ctrl =  $controller('SettingsCtrl', {
                $scope: scope,
                repo:repo
            });
            ctrl.scope = scope;
            return ctrl;
        };
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should get settings', function() {
        var ctrl = createCtrl();

        httpBackend.expect('POST','/api/settings/get').respond({
            settings:'settings'
        });
        httpBackend.expect('POST','/api/repo/get').respond({
            repo:'repo'
        });

        httpBackend.flush();
        (ctrl.scope.settings.value.settings).should.be.exactly('settings');
        (ctrl.scope.reposettings.value.repo).should.be.exactly('repo');
    });

    it('should add watched', function() {
        var ctrl = createCtrl();

        httpBackend.expect('POST', '/api/settings/get').respond({
                settings:'settings',
                watched:['one', 'two']
        });
        httpBackend.expect('POST','/api/repo/get').respond({
            repo:'repo'
        });

        httpBackend.flush();

        scope.addWatch('feature/*');

        httpBackend.expect('POST', '/api/settings/setWatched').respond(ctrl.scope.settings.value);
        httpBackend.flush();
        (scope.settings.value.watched.length).should.be.exactly(3);
        (ctrl.scope.reposettings.value.repo).should.be.exactly('repo');
    });

    it('should remove watched', function() {
        var ctrl = createCtrl();

        httpBackend.expect('POST', '/api/settings/get').respond({
                settings:'settings',
                watched:['one', 'two']
        });
        httpBackend.expect('POST','/api/repo/get').respond({
            repo:'repo'
        });

        httpBackend.flush();

        ctrl.scope.removeWatch('two');

        httpBackend.expect('POST', '/api/settings/setWatched').respond(ctrl.scope.settings.value);
        httpBackend.flush();

        (ctrl.scope.settings.value.watched.length).should.be.exactly(1);
        (ctrl.scope.reposettings.value.repo).should.be.exactly('repo');
    });

    it('should set Notifications', function() {

        var ctrl = createCtrl();

        httpBackend.expect('POST', '/api/settings/get').respond({
                settings:'settings',
                watched:['one', 'two'],
                notifications: ['yo wassup']

        });
        httpBackend.expect('POST','/api/repo/get').respond({
            repo:'repo'
        });

        httpBackend.flush();

        ctrl.scope.setNotifications();

        httpBackend.expect('POST', '/api/settings/setNotifications').respond(ctrl.scope.settings.value);
        httpBackend.flush();

        (ctrl.scope.settings.value.notifications.length).should.be.exactly(1);
        (ctrl.scope.reposettings.value.repo).should.be.exactly('repo');

    });

});
