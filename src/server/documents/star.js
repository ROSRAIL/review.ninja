var mongoose = require('mongoose');

var StarSchema = mongoose.Schema({
    sha: String,
    repo: Number,
    user: Number,
    name: String,
    created_at: Date
});

StarSchema.index({
    sha: 1,
    repo: 1,
    user: 1
}, {
    unique: true
});

var Star = mongoose.model('Star', StarSchema);

module.exports = {
    Star: Star
};
