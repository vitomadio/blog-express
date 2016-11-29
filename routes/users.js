var express = require('express');
var router = express.Router();
var csrf = require('csurf');
// var passport = require('passport');

var csrfProtection = csrf();

router.use(csrfProtection);

router.get('/profile', function(req,res,next){
	res.render('user/profile')
});

router.get('/signup', function(req,res,next){
	res.render('user/signup',{csrfToken:req.csrfToken()});
});

router.post('/signup', function(req,res,next){
	res.redirect('/users/profile');
});

module.exports = router;

