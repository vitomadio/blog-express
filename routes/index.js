var express = require('express');
var multer = require('multer');
var ObjectId = require('mongodb').ObjectID;

var router = express.Router();

var fs = require('fs');

var Post = require('../models/post');
var User = require('../models/user');
var Comment = require('../models/comment');
var Like = require('../models/like');

router.use(function(req,res,next){
	res.locals.user = req.user;
	next();
});

router.get('/', function(req,res,next){
	Post.find({}).populate('user').exec(function(err,post){						
			post.reverse();		
			res.render('blog/index', {posts:post,
								  							isAuthenticated:true								  
								  });			
		});
});

router.get('/:id', function(req,res){	
	Post.findById(req.params.id).populate('user').exec(function(err,post){
		Comment.find({post:req.params.id}).populate('user').exec(function(err,comments){
			if(err){res.redirect('/'); return};
			res.render('blog/show', {
				post:post,
				comments:comments		
			});
		});				
	});
});	

router.post('/:id/comment', isLoggedIn, function(req,res){
	var comment = new Comment({
		user: req.user,
		post: req.params.id,
		body: req.body.body
	});
	comment.save(function(err){
		if(!err){res.redirect('/'+req.params.id)
	}else{
		console.log(err)
	}
	});
});

router.get('/:id/like',isLoggedIn, function(req,res,next){
  	Post.findById(req.params.id,function(err,post){
  		Like.findOne({post:req.params.id, user:req.user}, function(err,like){
	  		if(!like){
		  			var like = new Like({
		  			user:req.user,
		  			post:post
		  		});
		  		like.save(function(err,like){
		  				if(post.like == []){
		  					post.update({count:1,heart:true,$push:{like:{like}}},function(err){
			  				if(!err){res.redirect('/')};
			   			});
		  			}else{
			  			var countUp = post.count + 1;
		  				post.update({count:countUp,$push:{like:like},heart:true},function(err){
		  					if(!err){res.redirect('/')}
		  				});
		  			};
		  		});	  		
	  		}else{ 			  		
		  			var reqUser = req.user;
		 			Like.findOne({post:req.params.id, user:reqUser},function(err,like){
		 				
		 				like.remove(function(err){
		 						var countDown = post.count - 1;

		 						var likeId = post.like[0];
		 						console.log(likeId);

		 					post.update({count:countDown,$pull:{like:likeId}}, function(err){
		 						Post.findById(req.params.id, function(err, post){
		 							console.log(post);
		 							if(post.count == 0){
		 							post.update({count: null, heart:false}, function(err){
		 								if(!err){res.redirect('/')};
		 									
		 							});
		 							}else{res.redirect('/')};
		 							
		 						})
		 					});		 						
		 				});
		 			});		  
	  		};
	  	});
  		});
  	
});
		  				
		  				
		  				

router.get('/:id/delete', function(req,res){
	// var id = new ObjectId(req.params._id);
	Post.findById(req.params.id).remove(function(err, post){
		if(!err){res.redirect('/')};
	});
});
			
router.get("/blog/new",function(req,res){
	res.render("blog/new");
});

router.post('/blog', multer({dest:'images/'}).single('imagen'),function(req,res){
	 
	var post = new Post({
		user: req.user,
		imagen: '/images/'+ req.file.originalname,
		title: req.body.title,
		description: req.body.description,
		count:null,
		heart:false
		
		
	});
	post.save(function(err){
		fs.rename(req.file.path,'public/images/'+ req.file.originalname);
		if(!err){
			res.redirect('/');
		}else{
			console.log(err)
		}
	});
});
 
module.exports = router;

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect('/user/signin');
};
		 						








