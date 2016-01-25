var express = require('express');
var passport = require('passport');
var app = express();
var index = require('./routes/index');
var bodyParser = require('body-parser');
var session = require('express-session');
var localStrategy = require('passport-local').Strategy;
var pg = require('pg');

app.use(session({
   secret: 'secret',
   resave: true,
   saveUninitialized: false,
   cookie: { maxAge: 60000, secure: false }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({expanded: true}));
app.use(passport.initialize());
app.use(passport.session());

// passport.use('local', new localStrategy({ passReqToCallback : true, usernameField: 'username' },
//    function(req, username, password, done) {
//    	console.log('called');
//    }
// ));


// console.log('test');
//SQL

var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/authentication_db';


passport.serializeUser(function(user, done) {
   console.log('called serializeUser');
   done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	console.log('called deserializeUser');
    pg.connect(connectionString, function (err, client) {

    	var user = {};
    	console.log('called deserializeUser - pg');
        var query = client.query("SELECT * FROM users WHERE id = $1", [id]);

        query.on('row', function (row) {
        	console.log('User row', row);
        	user = row;
        	done(null, user);
        });

        // After all data is returned, close connection and return results
        query.on('end', function () {
            client.end();
            // return res.json(results);
        });

        // Handle Errors
        if (err) {
            console.log(err);
        }
    });


});

passport.use('local', new localStrategy({
       passReqToCallback : true,
       usernameField: 'username'
    },
	function(req, username, password, done){
		console.log('called local');
	    pg.connect(connectionString, function (err, client) {
	    	
	    	console.log('called local - pg');

	    	var user = {};

	        var query = client.query("SELECT * FROM users WHERE username = $1", [username]);

	        query.on('row', function (row) {
	        	console.log('User obj', row);
	        	console.log('Password', password)
	        	user = row;
	        	if(password == user.password){
	        		console.log('match!')
	        		done(null, user);
	        	} else {
	        		done(null, false, { message: 'Incorrect username and password.' });
	        	}
	        	
	        });

	        // After all data is returned, close connection and return results
	        query.on('end', function () {
	            // client.end();
	            // return res.json(results);
	        });

	        // Handle Errors
	        if (err) {
	            console.log(err);
	        }
	    });
	
}));


app.use('/', index);

var server = app.listen(3000, function(){
	console.log('Listening on 3000');
})