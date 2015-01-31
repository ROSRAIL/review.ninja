module.exports = function(grunt) {

    var config = {

        pkg: grunt.file.readJSON('package.json'),

        mocha_istanbul: {
            coverage: {
                src: 'src/tests/server',
                options: {
                    coverage: true,
                    mask: '**/*.js',
                    coverageFolder: 'output/coverage'
                }
            }
        },

        coveralls: {
            mocha: {
                src: 'output/coverage/lcov.info'
            }
        },

        // server tests
        mochaTest: {
            server: {
                src: ['src/tests/server/**/*.js']
            }
        },

        // client tests
        karma: {
            unit: {
                configFile: 'src/tests/karma.ninja.js'
            }
        },

        eslint: {
            app: {
                files: {
                    src: ['*.js', 'src']
                }
            }
        },

        scsslint: {
            allFiles: [
              'src/client/assets/styles/*.scss'
            ],
            options: {
              config: '.scss-lint.yml',
              colorizeOutput: true
            }
        },

        http: {
            issue_comment: {
                options: {
                    url: 'http://localhost:' + (process.env.PORT || 5000) + '/github/webhook/' + grunt.option('id'),
                    headers: {
                        'x-github-event': 'issue_comment'
                    },
                    json: function() {
                        var json = require('./src/tests/fixtures/webhooks/issue_comment/' + grunt.option('action') + '.json');
                        json.action = grunt.option('action');
                        json.issue.number = grunt.option('number');
                        json.comment.id = grunt.option('comment');
                        json.comment.body = grunt.option('body');
                        json.repository.owner.login = grunt.option('user');
                        json.repository.name = grunt.option('repo');
                        json.repository.id = grunt.option('repo_uuid');
                        return json;
                    }
                }
            },
            issues: {
                options: {
                    url: 'http://localhost:' + (process.env.PORT || 5000) + '/github/webhook/' + grunt.option('id'),
                    headers: {
                        'x-github-event': 'issues'
                    },
                    json: function() {
                        var json = require('./src/tests/fixtures/webhooks/issues/' + grunt.option('action') + '.json');
                        json.action = grunt.option('action');
                        json.sender = grunt.option('sender');
                        json.issue.id = grunt.option('issue');
                        json.issue.number = grunt.option('number');
                        json.issue.milestone.number = grunt.option('milestone');
                        json.repository.owner.login = grunt.option('user');
                        json.repository.name = grunt.option('repo');
                        json.repository.id = grunt.option('repo_uuid');
                        return json;
                    }
                }
            },
            pull_request: {
                options: {
                    url: 'http://localhost:' + (process.env.PORT || 5000) + '/github/webhook/' + grunt.option('id'),
                    headers: {
                        'x-github-event': 'pull_request'
                    },
                    json: function() {
                        var json = require('./src/tests/fixtures/webhooks/pull_request/' + grunt.option('action') + '.json');
                        json.action = grunt.option('action');
                        json.sender = grunt.option('sender');
                        json.pull_request.number = grunt.option('number');
                        json.repository.owner.login = grunt.option('user');
                        json.repository.name = grunt.option('repo');
                        json.repository.id = grunt.option('repo_uuid');
                        return json;
                    }
                }
            },
            status: {
                options: {
                    url: 'http://localhost:' + (process.env.PORT || 5000) + '/github/webhook/' + grunt.option('id'),
                    headers: {
                        'x-github-event': 'status'
                    },
                    json: function() {
                        var json = require('./src/tests/fixtures/webhooks/status.json');
                        json.commit.sha = grunt.option('sha');
                        json.repository.name = grunt.option('repo');
                        json.repository.id = grunt.option('repo_uuid');
                        return json;
                    }
                }
            }
        }
    };

    // Initialize configuration
    grunt.initConfig(config);

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('lint', ['eslint', 'scsslint']);
    grunt.registerTask('coverage', ['mocha_istanbul', 'coveralls']);
    grunt.registerTask('default', ['eslint', 'mochaTest', 'karma']);
};
