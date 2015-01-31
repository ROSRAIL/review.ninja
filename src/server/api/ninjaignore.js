// libraries
var minimatch = require('minimatch');

// services
var github = require('../services/github');

module.exports = {
    get: function(req, done) {
        github.call({
            obj: 'repos',
            fun: 'getContent',
            arg: {
                user: req.args.user,
                repo: req.args.repo,
                ref: req.args.ref,
                path: '.ninjaignore'
            },
            token: req.user.token
        }, function(err, file) {
            if(!err) {
                try {
                    var ninja = new Buffer(file.content, 'base64').toString('ascii');
                    ninja.split(/[\r\n]+/).forEach(function(ignore) {
                        if(ignore !== '') {
                            req.args.files.forEach(function(file) {
                                file.ignored = minimatch(file.filename, ignore);
                            });
                        }
                    });
                } catch(err) {}
            }

            done(null, req.args.files);
        });
    }
};
