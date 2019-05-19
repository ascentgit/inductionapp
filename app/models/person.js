// get an instance of mongoose and mongoose.Schema
var config			= require('./config'); // get our config file
var mongoose 		= require('mongoose');
var connection 		= mongoose.createConnection(config.authentication); 
var Schema 			= mongoose.Schema;

var remarksSchema = mongoose.Schema({
	remark: String
},{ _id : false });

module.exports = connection.model('person', new Schema({ 
	company_code: String,
	batch_id: String, 
	first_name: String,
    last_name: String,
	emailId: String,
	phone: String,
	designation: String,
	remarks: [remarksSchema],
	create_date: Date,
	update_date: Date,
	create_by: String,
	update_by: String,
	active: Boolean
}),'person');