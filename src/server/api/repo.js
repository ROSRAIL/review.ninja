var keenio = require('../services/keenio');
// models
var Repo = require('mongoose').model('Repo');

module.exports = {

    get: function(req, done) {
        Repo.findOne({repo: req.args.repo_uuid}, function(err, repo) {

            if(repo) {
                return done(err, repo);
            }

            Repo.create({
                repo: req.args.repo_uuid
            }, done);
        });
    },

    setComment: function(req, done) {
        Repo.findOneAndUpdate({
            repo: req.args.repo_uuid
        }, {
            comment: req.args.comment
        }, {}, function(err, obj) {
            keenio.addEvent('AddComment', req.args);
            done(err, obj);
        });
    },

    setThreshold: function(req, done) {
        Repo.findOneAndUpdate({
            repo: req.args.repo_uuid
        }, {
            threshold: req.args.threshold
        }, {}, function(err, obj) {
            if (!err) {
                keenio.addEvent('SetThreshold', req.args);
            }
            done(err, obj);
        });
    }

};
