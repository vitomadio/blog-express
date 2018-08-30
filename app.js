var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var expHbs = require('express-handlebars');
var mongoose = require('mongoose');
var passport = require('passport');
var passportLocal = require('passport-local');
var expressValid = require('express-validator');
var flash = require('connect-flash');


var routes = require('./routes/index');
var users = require('./routes/users');


var app = express();

mongoose.connect('mongodb://<username>:<password>@ds149567.mlab.com:49567/blognode');
require('./config/passport');
// view engine setup


app.engine('.hbs', expHbs({defaultLayout: 'layout', extname:'.hbs'}));
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValid());
app.use(cookieParser());
app.use(session({secret:'secret',
                 resave: false,
                 saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal.Strategy(function(username, passport, done){

}));

passport.serializeUser(function(user, done){
  done(user.id);
});

passport.deserializeUser(function(id, done){
  done({id: id,})
});

app.use(express.static(path.join(__dirname, 'public')));

// app.use(function(req, res, next){
//   res.locals.login = req.isAuthenticated();
//   res.locals.session = req.session;
//   next();
// });

app.use(function(req, res, next){
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  res.locals.user = req.user;
  next();
});

app.use('/user',users);
app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
