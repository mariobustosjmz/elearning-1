var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var cache = require('memory-cache');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var multer = require('multer');
var upload = multer({ dest: 'public/uploads/' });
mongoose.connect("mongodb://luong:123456@ds011890.mlab.com:11890/luong");

// mongoose.connect('mongodb://localhost/elearn'); 
var db = mongoose.connection;
async = require('async');

var routes = require('./routes/index');
var users = require('./routes/users');
var classes = require('./routes/classes');
var students = require('./routes/students');
var instructors = require('./routes/instructors');
var comments = require('./routes/comments'); 
var ratings = require('./routes/ratings');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');

// Handle File upload
app.use(upload.fields([{name: 'avatar', maxCount: 1}, {name: 'material', maxCount: 1}, {name: 'image', maxCount: 1}]));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Handle Express Session
app.use(session({
  secret:'son+luong+hung',
  saveUninitialized: true,
  resave: true
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
//app.use(passport.authenticate('local'));


// Validator
// In this example, the formParam value is going to get morphed into form body format useful for printing.
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(flash());

//messages
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  res.locals.isHome = (req.url == '/');
  next();
});

//Make user object global in all views
app.get('*', function(req, res, next) {
  res.locals.user = req.user || null;
  if (req.user){
    res.locals.usertype = req.user.type;
  }
  next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/classes', classes);
app.use('/students', students);
app.use('/instructors', instructors);
app.use('/comments', comments);
app.use('/ratings', ratings);

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


var User = require('./models/user');
var connections = [];

// console.log(1111);

var io = require('socket.io')();

var pollingLoop = function(connections) {

    // console.log(2222);
    //Doing the database query
    console.log('Number of connections sent:' + connections.length);
    for (i in connections) {
        var socket = connections[i];
        var user_id = socket.request._query['user_id'];
        console.log("user_id = " + user_id);
        var query = User.findById(user_id, function(err, user){
            // console.log(user);
            socket.volatile.emit('notification', user);
        });
    }
};

// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
    console.log('A new socket is connected!');
    connections.push(socket);
    console.log('Number of connections:' + connections.length);
    // starting the loop only if at least there is one user connected
    if (connections.length) {
        pollingLoop([socket]);
    }

    socket.on('disconnect', function() {
        var socketIndex = connections.indexOf(socket);
        console.log('socketID = %s got disconnected', socketIndex);
        if (~socketIndex) {
            connections.splice(socketIndex, 1);
        }
    });
});

module.exports.sendN = function sendN(){
  pollingLoop(connections);
}
app.io = io;
module.exports = app;
