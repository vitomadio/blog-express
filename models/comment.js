var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = Schema({
	user: {type: Schema.Types.ObjectId, ref: 'User'},
	post: {type: Schema.Types.ObjectId, ref: 'Post'},
	body: {type: String, require: true}
});

module.exports = mongoose.model('Comment', schema);