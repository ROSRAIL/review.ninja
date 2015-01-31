// models
var Settings = require('mongoose').model('Settings');

module.exports = {

    get: function(req, done) {
        Settings.findOne({user: req.user.id, repo: req.args.repo_uuid}, function(err, settings) {
            // check if settings exist and return them
            if(settings) {
                return done(err, settings);
            }

            // if they don't exist create them
            Settings.create({
                user: req.user.id,
                repo: req.args.repo_uuid
            }, done);
        });
    },

    setWatched: function(req, done) {
        // uniquify the watched array
        var uniquifier = {};
        var uniqueWatched = [];
        req.args.watched.forEach(function(watched) {
            if(!uniquifier.hasOwnProperty(watched)) {
                uniquifier[watched] = true;
                uniqueWatched.push(watched);
            }
        });

        Settings.findOneAndUpdate({
            user: req.user.id,
            repo: req.args.repo_uuid
        }, {
            watched: uniqueWatched
        }, {}, done);
    },

    setNotifications: function(req, done) {
        Settings.findOneAndUpdate({
            user: req.user.id,
            repo: req.args.repo_uuid
        }, {
            notifications: req.args.notifications
        }, {}, done);
    }

};
