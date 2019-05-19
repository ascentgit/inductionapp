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

mongoose.connect(config.mongosession);
var sessionStore = new MongoStore({mongooseConnection: mongoose.connection });
	
app.use(session({
    cookie: { maxAge: 1000*60*30 } ,
	//This is the Secret Key
    secret: process.env.SESSION_SECRET,
    store: sessionStore
}));

//Schema Mapping
var user                = require('./app/models/user');
var person              = require('./app/models/person');
var company             = require('./app/models/company');

var path = __dirname + '/public/';
app.set('view engine', 'html');

app.engine('html', ejs.renderFile);
app.use('/resources', express.static(path + 'resources'));
app.set('views', path);
app.use("/", router);

router.use(function (req, res, next) {
	next();
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

var generateId = function(_prefix){
	var min = 100; 
    var max = 10000000; 
	return _prefix + (Math.floor(Math.random() * (+max - +min)) + (+min) ); 
}

var urlFormatter = function(_userData){
	switch(_userData.role){
		case 'GUEST': return path + 'app-induction.html';
		case 'ADMIN': return path + 'app-' + _userData.homeUrl + '.html';
	}
	return path + 'app-induction.html'
}

app.get("/", function(req,res){
	if(null != req.session.userData){
		res.redirect('/' + req.session.userData.homeUrl);
	} else {
		res.render('login.html', {message: ''});
	}
});

//All URL Patterns Routing
app.get("/", function(req,res){
	if(null != req.session.userData){
		res.redirect('/' + req.session.userData.homeUrl);
	} else {
		res.render('login.html', {message: ''});
	}
});

app.get("/login", function(req,res){
	if(null != req.session || undefined != req.session)
		req.session.destroy();
	res.render('login.html', {message: ''});
});	

app.get("/authenticate", function(req, res){
	res.redirect('/login');
});

app.post("/authenticate", function(req, res){
	let username = req.body.username || req.query.username;
	let password = req.body.password || req.query.password;
	if(undefined != username && undefined != password && '' != username && '' != password){
		user.findOne({username: username}, function(err, userData) {
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

app.get("/dashboard", function(req,res){
	if(req.session.userData == undefined)
		res.redirect('/login');
	else res.sendFile(urlFormatter(req.session.userData));
});

app.get("/induction", function(req,res){
	if(req.session.userData == undefined)
		res.redirect('/login');
	else res.sendFile(path + 'app-induction.html');
});

app.get("/company", function(req,res){
	if(req.session.userData == undefined)
		res.redirect('/login');
	else res.sendFile(path + 'app-company.html');
});

app.get("/logout", function(req,res){
	res.redirect('/login');
});

/*
	APIs
*/
router.get('/user', function(req, res) {
  if(req.session.userData == undefined) return {};
  res.json({success: true, userData: req.session.userData});
});

app.get("/getcompanies", function(req,res){
	if(req.session.userData == undefined) return {};
	company.find(function(err, companyList){
		res.json(companyList == null ? [] : companyList);
	});
	
});

app.post("/createcompany", function(req,res){
	if(req.session.userData == undefined) return {};
	let name = req.body.name || req.query.name;
	let address = req.body.address || req.query.address;
	var _company = new company({
		company_code: generateId('COM'),
		name: name,
		address: address,
		status: 'Initiated',
		create_date: new Date(),
		create_by: req.session.userData.username,
		active: true
	});
	_company.save(function(err){
		res.redirect('/company');
	});
});

http.listen(process.env.PORT || 3010, () => {				
	logger.log('##################################################');
	logger.log('        Ascent Induction App ');
	logger.log('        Process Port :' + process.env.PORT);
	logger.log('        Local Port   :' + 3010);
	logger.log('##################################################');
});	