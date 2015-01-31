// module
var github = require('../services/github');
var merge = require('merge');
var path = require('path');
// models
var User = require('mongoose').model('User');

module.exports = {

    /************************************************************************************************************

    @github

    + <req.obj>.<req.fun>

************************************************************************************************************/

    call: function(req, done) {
        github.call(merge(req.args, {
            token: req.user.token
        }), function(err, res, meta) {
            done(err, {
                data: res,
                meta: meta
            });

            // automatically add to users repo array
            if(!err && req.args.obj === 'repos' && req.args.fun === 'get' && res.permissions && res.permissions.push) {

                User.findOne({ uuid: req.user.id }, function(err, user) {
                    if(user) {
                        var found = false;
                        user.repos.forEach(function(repo) {
                            if(repo === res.id) {
                                found = true;
                            }
                        });

                        if(!found) {
                            user.repos.push(res.id);
                            user.save();
                        }
                    }
                });
            }
        });
    },

    wrap: function(req, done) {
        github.call(merge(req.args, {
            token: req.user.token
        }), function(err, res, meta) {

            if(err) {
                return done(err, {
                    data: res,
                    meta: meta
                });
            }

            try {
                var wrap = require( path.join('../wrap', req.args.obj) );

                wrap[req.args.fun](req, res, function(err, res) {
                    done(err, {
                        data: res,
                        meta: meta
                    });
                });
            }
            catch(ex) {
                done(err, {
                    data: res,
                    meta: meta
                });
            }
        });
    }
};
