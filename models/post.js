var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = Schema({
	_id: Number,
	imagen:{type:String, required:true},
	title: {type:String, required:true},
	description: {type:String, required:true}
});

module.exports = mongoose.model('Post', schema);