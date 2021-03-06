var mongoose = require('mongoose');

//Student Schema
var studentSchema = mongoose.Schema({
	first_name:{
		type: String
	},
	last_name:{
		type: String
	},
	address:[{
		street_address: {type: String},
		city: {type:String},
		state: {type:String},
		zip:{type:String}
	}],
	username:{
		type: String,
		index: { unique: true }
	},
	email: {
		type: String
	},
	user_id: String,
	classes:[{
		class_id:{
			type: [mongoose.Schema.Types.ObjectId]
		},
		class_title:{
			type: String
		}
	}]
});

function checkInClass(student, class_id) {
	if (!student) return false;
	if (student.classes){				
		for ($i=0; $i<student.classes.length; $i++) {
			if (class_id == student.classes[$i].class_id) {
				return true;
			}
		}
	}
	return false;
}

var Student = module.exports = mongoose.model('Student', studentSchema);

module.exports.getStudentByUsername = function(username, callback) {
	var query = {
		username: username
	}
	try{
		Student.findOne(query, callback);
	} catch(err) {
		console.log("models students error" + err);
	}
}

module.exports.register = function(info, callback){
	student_username = info.student_username; 
	class_id = info.class_id;
	class_title = info.class_title;
	try{		
		ok = true;
		Student.getStudentByUsername(student_username, function(err, student){
			if (err) throw err;
			// console.log("checkIn = ", checkInClass(student, class_id));

			if ( !checkInClass(student, class_id) ) {
				student.update({$push: {"classes": {class_id: class_id, class_title: class_title}}},
					{safe:true, upsert: false},
					callback
				);
			}
			else {
				callback(null, null);
			}
		});

	} catch(err){
		console.log(err);
	}
}

