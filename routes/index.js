var express = require('express');
var multer = require('multer');

var router = express.Router();

var fs = require('fs');


var Post = require('../models/post');

router.get("/blog/new",function(req,res){
	res.render("blog/new");
});

router.get('/',function(req,res,next){
	Post.find({},function(err,docs){
		docs.sort(function(a,b){
			if(a<b){return -1}
				else if(a>b){return 1}
					else{return 0}
		})
		
		if(err){res.redirect('/');return }
		res.render('blog/index', {posts:docs})
	});
})

router.post('/blog', multer({dest:'images/'}).single('imagen'),function(req,res){
	 
	var post = new Post({
		imagen: '/images/'+ req.file.originalname,
		title: req.body.title,
		description: req.body.description,
		_id: ''
	});
	post.save(function(err){
		fs.rename(req.file.path,'public/images/'+ req.file.originalname);
		if(!err){
			res.redirect('/blog');
		}else{
			console.log(err)
		}
	});
	console.log(req.file.originalname);			
}) 
		
module.exports = router;
