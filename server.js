/*
	Apes's Console
*/

const express  		= require("express");
var mongoose    	= require('mongoose');
var url 			= require("url");
var app 			= express();
var http 			= require('http').Server(app);
var router 			= express.Router();
var ejs 	 		= require('ejs');

var emailHelper 	= require('sendgrid').mail;

var logger 			= require("./logging-component");
var emailconfig 	= require('./emailconfig'); // get our config file
/*
	Cloud MongoDB Based Security & Operations
*/
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var session      = require('express-session');
var MongoStore   = require('connect-mongo')(session);

app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
//MongoDB Connection Details

var config = require('./app/models/config'); // get our config file

mongoose.connect(config.mongosession, { useNewUrlParser: true });
var sessionStore = new MongoStore({mongooseConnection: mongoose.connection });
	
app.use(session({
    cookie: { maxAge: 1000*60*30 } ,
	//This is the Secret Key
    secret: process.env.SESSION_SECRET,
    store: sessionStore
}));

//Schema Mapping
var user                = require('./app/models/user');

var path = __dirname + '/public/';
app.set('view engine', 'html');

app.engine('html', ejs.renderFile);
app.use('/resources', express.static(path + 'resources'));
app.set('views', path);
app.use("/", router);

router.use(function (req, res, next) {
	next();
});
/*
	Get Method not Allowed for authentication
*/
router.get("/authenticate", function(req, res){
	res.redirect('/login');
});

router.post("/authenticate", function(req, res){
	let userId = req.body.userId || req.query.userId;
	let password = req.body.password || req.query.password;
	if(undefined != userId && undefined != password && '' != userId && '' != password){
		user.findOne({userId: userId}, function(err, userData) {
			if (!userData) {
			  res.render('login.html', {message: 'User not found'});
			} else {
				if (userData.password != password) {
					res.render('login.html', {message: 'Invalid Password'});
				} else if(!userData.active){
					res.render('login.html', {message: 'Incative User. Please contact Admin'});
				} else {
					userData.password = '';
					req.session.userData = userData;
					console.log(req.session.userData.homeUrl);
					res.redirect('/' + userData.homeUrl);
				}
			}
		});	
	} else {
		res.render('login.html', {message: 'User Id/Password cannot be blank'});
	}
});	

router.get("/getuser", function(req,res){
	if(req.session.userData != undefined && req.session.userData.userId != undefined){
		if(req.session.userMenu == undefined){
			menu.find({userId: req.session.userData.userId, web: true}, function(err, userMenu) {
				req.session.userMenu = userMenu;
				res.json({ success: true, userData: req.session.userData, userMenu: userMenu});
			});
		} else {
			res.json({ success: true, userData: req.session.userData, userMenu: req.session.userMenu});
		}
	} else res.json({success: false, operation: false, message: 'Session Expired. Please login again'});
});

var emailService = function(emailContainer, callBack){
	var sg = require('sendgrid')(emailconfig.email_api_key);
	var request = sg.emptyRequest({
	  method: 'POST',
	  path: '/v3/mail/send',
	  body: {
		personalizations: [
		  {
			to: emailContainer.toIdList,
			subject: emailContainer.subject
		  }
		],
		from: {
		  email: 'ascent-induction@ascent.com'
		},
		content: [
		  {
			type: 'text/plain',
			value: emailContainer.content
		  }
		]
	 }
	});	
	sg.API(request, function (error, response) {
		  console.log(response.statusCode);
		  console.log(response.body);
		  console.log(response.headers);		
		  if (error) {
			  callBack.failure();
		  } else {
			callBack.success(response);
		  }
	});	
}

var emailHandler = function(emailContainer, callBack){
  	emailService(emailContainer, {
		success: function(r){
			callBack.success(r);
		}, failure: function(){
			callBack.failure();
		}
	});
}

router.get('/', function(req, res) {
  res.json({ message: 'Welcome to SmartCom! Please Authenticate to Get Access Token.' });
});

router.get('/user', function(req, res) {
  var userId = req.body.userId || req.query.userId;
  user.findOne({'userId': userId}, function(err, userData) {
	userData.password = null;
	menu.find({'userId': userId, app: true }, function(err, menuList) {
		res.json({success: true, data: userData, menu: menuList});
	});
  });
});

//All URL Patterns Routing
app.get("/", function(req,res){
	if(null != req.session.userData){
		res.redirect('/' + req.session.userData.homeUrl);
	} else {
		res.render('login.html', {message: 'Session Expired. Please Login Again.'});
	}
});

var urlFormatter = function(_userData){
	switch(_userData.ROLE){
		case 'GUEST': return path + 'app-induction.html';
		case 'ADMIN': return path + 'app-' + req.session.userData.homeUrl + '.html';
	}
	return path + 'app-induction.html'
}

router.get("/login", function(req,res){
	if(null != req.session || undefined != req.session)
		req.session.destroy();
	res.render('login.html', {message: ''});
});	

router.get("/dashboard", function(req,res){
	if(req.session.userData == undefined)
		res.redirect('/login');
	else res.sendFile(urlFormatter(req.session.userData));
});

router.get("/induction", function(req,res){
	if(req.session.userData == undefined)
		res.redirect('/login');
	else res.sendFile(path + 'app-induction.html');
});

router.get("/logout", function(req,res){
	res.redirect('/login');
});

app.get("/logout", function(req,res){
	res.redirect('/login');
});

http.listen(port, () => {				
	logger.log('##################################################');
	logger.log('        Ascent Induction App ');
	logger.log('        Process Port :' + process.env.PORT);
	logger.log('        Local Port   :' + port);
	logger.log('##################################################');
});	