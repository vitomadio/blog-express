var express = require('express');
var router = express.Router();
var multer = require('multer');
var csrf = require('csurf');
var passport = require('passport');
var fs = require('fs');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var xoauth2 = require('xoauth2');

var User = require('../models/user');
var Post = require('../models/post');

var csrfProtection = csrf();

//Solo permite acceso a los logeados

router.get('/profile/:id', isActive, function(req,res,next){
  var postUser = req.params.id;
    Post.find({user:postUser},function(err,post){
        res.render('user/profile', {
      user:req.user,
      posts:post
    });
  });
});

router.get('/:id/edit', isActive, function(req,res,next){
		res.render('user/edit', {
			user:req.user
		});
});

router.post('/:id/edit', multer({dest:'images/'}).single('avatar'), function(req,res){
	User.findById({_id:req.params.id}, function(err,user){
		user.update({
			name: req.body.name,
			lastName: req.body.lastname,
			age: req.body.age,
			avatar: '/images/'+req.file.originalname
		}, function(err,userId){
			fs.rename(req.file.path,'public/images/'+ req.file.originalname);
			if(err){console.log(err)};
				res.redirect('/user/profile/'+req.params.id);
		});
	});
});
	

router.get('/logout', isLoggedIn, function(req, res, next){
  req.logout();
  res.redirect('/');
});

router.get('/verify/:token', function(req,res,next){
    User.findOne({verifyToken:req.params.token}, function(err, user){
      res.render('user/verify', {
          user:user
        });
    });
});

router.post('/verify/:token', function(req,res,next){
    User.findOne({verifyToken:req.params.token}, function(err, user){
      user.update({
        active:true,
        verifyToken: undefined
      }, function(err, user){
        res.redirect('/');
      });
    });
});

//redirige a los logueados que quieren acceder al signin

router.use('/',notLoggedIn, function(req, res, next){
  next();
});

// SignUp

router.get('/signup', csrfProtection,function(req, res, next){
  var messages = req.flash('error');
  res.render('user/signup', {csrfToken:req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
});

router.post('/signup/:token', passport.authenticate('local.signup', {		
  failureRedirect: '/user/signup',
  failureFlash: true
}), function(req, res, next){
    var token = req.params.token
    var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'Gmail',
        auth: {
          xoauth2: xoauth2.createXOAuth2Generator({
            user: 'YOUR EMAIL HERE',
            clientId: 'YOUR CLIENT ID',
            clientSecret: 'CLIENT SECRET',
            refreshToken: 'TOKEN'
          })
        }
    });
    var mailOptions = {
        to: req.body.email,
        from: 'Accountverification@demo.com',
        subject: 'Account verification',
        text: 'Hello,\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/user/verify/'+token+ ' \n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
    };
    smtpTransport.sendMail(mailOptions, function() {
      req.flash('info', 'An e-mail has been sent to ' + req.body.email + ' with further instructions.');
      
    });
    var email = req.body.email;
    if(req.session.oldUrl){
      var oldUrl = req.session.oldUrl;
      req.session.oldUrl = null;
      res.redirect(oldUrl);
    }else{
      res.redirect('/');
    };
});



//SignIn

router.get('/signin', csrfProtection, function(req,res,next){
  var messages = req.flash('error');
  res.render('user/signin', {csrfToken:req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
});

router.post('/signin', passport.authenticate('local.signin', {
  failureRedirect: '/user/signin',
  failureFlash: true
}), function(req, res, next){
  if(req.session.oldUrl){
    var oldUrl = req.session.oldUrl;
    req.session.oldUrl = null;
    res.redirect(oldUrl);
  }else{
    res.redirect('/');
  }
});

// if forgot passsword

router.get('/forgot',function(req,res){
  res.render('user/forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/user/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'Gmail',
         auth: {
          xoauth2: xoauth2.createXOAuth2Generator({
            user: 'YOUR EMAIL',
            clientId: 'YOUR CLIENT ID',
            clientSecret: 'YOUR CLIENT SECRET',
            refreshToken: 'TOKEN'
          })
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/user/forgot');
  });
});

// Reset password

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/user/forgot');
    }
    res.render('user/reset', {
      user: req.user,
      token: req.params.token
    });
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        var password = user.encryptPassword(req.body.password);

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'Gmail',
       auth: {
          xoauth2: xoauth2.createXOAuth2Generator({
            user: 'YOUR EMAIL',
            clientId: 'YOUR CLIENT ID',
            clientSecret: 'YOUR CLIENT SECRET',
            refreshToken: 'TOKEN'
          })
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});



module.exports = router;

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
};

function notLoggedIn(req, res, next){
  if(!req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
};

function isActive(req,res,next){
  if(req.user.active == true){
    return next();
  }
  res.redirect('/');
};



