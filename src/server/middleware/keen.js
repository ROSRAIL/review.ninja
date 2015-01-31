var keenio = require('../services/keenio');

module.exports = function(req, res, next) {
    keenio.addEvent(req.args.fun + '_' + req.args.obj, req.args);
    next();
};
