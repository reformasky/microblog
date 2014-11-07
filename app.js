var express = require('express'),
    path = require("path"),
    fs = require("fs"),
    expressLayouts = require("express-ejs-layouts");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');

var routes = require('./routes/index');
var users = require('./routes/users');
var session    = require('express-session');
var MongoStore = require('connect-mongo')(session);


var settings = require('./settings');

var app = express();




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
/*app.use(express.router(routes));*/

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.use(session({
    secret: settings.cookieSecret,
    store: new MongoStore({
      db : settings.db,
    })
  }));

app.use(function(req, res, next) {
    var msgs = req.session.messages || [];
    res.locals.messages =  msgs
    res.locals.hasMessages = !!msgs.length;
    req.session,messages = [];
    next();
})

app.use(function(req, res, next) {
    app.locals.user =  req.session.user;
    app.locals.error = function(req, res) {
        var err = req.flash('error');
        if(err.length) return err;
        else return null;
    }(req, res);
    app.locals.success 
    = function(req, res) {
        var succ = req.flash("success");
        if(succ.length) return succ;
        else return null;
    }(req, res);
    next();
})



require("./routes/routes")(app)



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
