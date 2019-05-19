// get an instance of mongoose and mongoose.Schema
var config			= require('./config'); // get our config file
var mongoose 		= require('mongoose');
var connection 		= mongoose.createConnection(config.authentication); 
var Schema 			= mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = connection.model('user', new Schema({ 
	username: String,
	password: String, 
    first_name: String,
    last_name: String,
	emailId: String,
	role: String,
	homeUrl: String,
	active: Boolean
}),'user');