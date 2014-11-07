var crypto = require("crypto");
var User = require('../models/user.js');
var Post = require("../models/post.js");

module.exports = function(app) {

	var settings = require("../settings.js");
	var Db = require('mongodb').Db;
	var Connection = require('mongodb').Connection;
	var Server = require('mongodb').Server;
	var mongodb = new Db(settings.db, new Server(settings.host, 27017, {}))

	app.get("/", function(req, res) {
		Post.get(null, function(err, posts){
			if(err) {
				posts = [];
			}			
			return res.render("index", {title : "Xuan's microblog", posts : posts});
		})				
	});

	app.get("/test", function(req, res) {
		res.render("test", {title: "test", posts: "post"})
	})

	app.all("/reg", checkNotLogin);
	app.all("/reg", function(req, res, next) {		
		if(req.method == "GET") {			
			res.render("reg",{title: "Register"});
		}
		else {

			if(req.body['password-repeat'] != req.body['password']) {
				req.flash('error', 'Password must be the same');
				return res.redirect("/reg");
			}

			var md5 = crypto.createHash('md5');
			var password = md5.update(req.body.password).digest('base64');

			var newUser = new User({
				name: req.body.username,
				password : password,
			});
			User.get(newUser.name, function(err, user) {
			if(user) 
				err = 'User already exist';
			if(err) {
				req.flash('error', err);
				return res.redirect("/reg");
			}
			newUser.save(function(err) {
				if(err) {
					req.flash('error',err);
					return res.redirect("/reg");
				}
				req.session.user = newUser;
				/*req.session.messages = ["success","registering success!"]*/
				req.flash("success", "registering success!");
				/*console.log("the massage is "+ mes);*/
				res.redirect("/");
			});
		});

		}
	})
	
	app.all("/login", checkNotLogin);
	app.all("/login", function(req, res) {
		if(req.method == "GET") {
			res.render("login", {title : "login"})
		}
		else if(req.method == "POST") {
			

			var md5 = crypto.createHash('md5');
			var password = md5.update(req.body.password).digest('base64');
			
			User.get(req.body.username,function(err,user){
				if(!user){
					req.flash('error',"User doesn't exist");
					return res.redirect("/login");
				}
				if(user.password != password) {
					req.flash("error","invalid password");
					return res.redirect("/login");
				}

				req.session.user = user;
				req.flash('success', "Login successful");
				res.redirect("/");
			});
		}
	});

	app.get("/logout", checkLogin);
	app.get("/logout", function(req, res) {
		req.session.user = null;
		req.flash("success", "logout successful")
		res.redirect("/");
	})

	app.all("/post", checkLogin);
	app.all("/post", function(req, res) {
		if(req.method == "POST") {
			var currentUser = req.session.user;
			var post = new Post(currentUser.name, req.body.post);
			post.save(function(err){
				if(err){
					req.flash("error", err);
					return res.redirect("/");
				}
				req.flash('success', "Post successful")
				res.redirect("/u/" + currentUser.name);
			});
		}

	});

	app.get("/u/:user", function(req, res) {
		User.get(req.params.user, function(err, user) {
			if(!user) {
				req.flash('error', "User doesn't exist")
				return res.redirect("/");
			}
			Post.get(user.name, function(err, posts){
				if(err) {
					req.flash("error", err);
					return res.redirect("/");
				}
				return res.render("user", {
					title: user.name,
					posts : posts,
				});
			});
		});
	});


}

function checkLogin(req, res, next) {
	if(!req.session.user) {
		req.flash("error", "user has not logged in");
		return res.redirect("/login");
	}
	next();
}

function checkNotLogin(req, res, next) {
	if(req.session.user) {
		req.flash('error', "user has already logged in");
		return res.redirect("/");
	}
	next();
}