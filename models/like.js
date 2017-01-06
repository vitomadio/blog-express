var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = require('mongodb').ObjectId;

var schema = Schema({
	user:{type: Schema.Types.ObjectId, ref: 'User'},
	post:{type: Schema.Types.ObjectId, ref: 'Post'}
	});

module.exports = mongoose.model('Like', schema);
