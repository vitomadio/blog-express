var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = require('mongodb').ObjectId;

var schema = Schema({
	user:{type: Schema.Types.ObjectId, ref: 'User'},
	like:[{type: Schema.Types.ObjectId, ref: 'Like'}],
	count:Number,
	heart:Boolean,
	imagen:{type:String, required:true},
	title: {type:String, required:true},
	description: {type:String, required:true},
	
});

module.exports = mongoose.model('Post', schema);



