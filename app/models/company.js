// get an instance of mongoose and mongoose.Schema
var config			= require('./config'); // get our config file
var mongoose 		= require('mongoose');
var connection 		= mongoose.createConnection(config.authentication); 
var Schema 			= mongoose.Schema;

var remarksSchema = mongoose.Schema({
	remark: String
},{ _id : false });

var contactSchema = mongoose.Schema({
	name: String,
	designation: String,
	department: String,
	email: String,
	phone: String,
	altPhone: String,
	availability: String
},{ _id : false });

var batchSchema = mongoose.Schema({
	batch_id: String,
	start_date: Date,
	end_date: Date,
	status: String,
	active: Boolean
},{ _id : false });

module.exports = connection.model('company', new Schema({ 
	company_code: String,
	name: String, 
	address: String,
	contact: [
		contactSchema
	],
	batch: [
		batchSchema
	],
	remarks: [
		remarksSchema
	],
	status: String,
	create_date: Date,
	update_date: Date,
	create_by: String,
	update_by: String,
	active: Boolean
}),'company');