require('dotenv/config');

const express = require('express')
const app = express();
app.use(express.json());

const mongo = require('mongoose');

const schema = require('./model/model')

mongo.connect('mongodb+srv://yogi:21032103@cluster0.nmyxz.mongodb.net/Todo_API?retryWrites=true&w=majority',{ useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false},
function(err) { 
	if(err){
		console.log("Error while connecting to DB");
	}else{
		console.log("Connected to DB");
	}
});

// root directort of web
app.get('/', function (req, res) {
	res.send('Hello this is the home page please hit correct url');
});

//add get request which shows usage
app.get('/add',function(req,res){
	errorMessage = {}
	res.header("Content-Type",'application/json');
	errorMessage['usage'] = JSON.parse('{"task_name": "karma","task_desc": "karma","task_creator": "karma","task_duration": "1"}')
	res.send(JSON.stringify(errorMessage,null,4))

});

// list get request to list all vaialable task 
app.get('/list', function  (req, res){
	var dataMap = {}
	  schema.find({},function(err,list){
		 if(err){
			 console.log(err)
			 res.send(err)
		 }else{
			//console.log(list)
			list.forEach(function(data){
				scam = {}
				console.log(data.expireAt)
				console.log(data.task_createdAt)
				scam['_id'] = data._id
				scam['expireAt'] = new Date(Date.parse(new Date(data.expireAt)) + (3600000*5.5)).toISOString().replace(/T/, ' ').replace(/\..+/, '')//moment.utc(data.expireAt).local()//Date()
				scam['task_name'] = data.task_name
				scam['task_desc'] = data.task_desc
				scam['task_creator'] = data.task_creator
				scam['task_duration'] = data.task_duration
				scam['task_createdAt'] =  new Date(Date.parse(new Date(data.task_createdAt)) + (3600000*5.5)).toISOString().replace(/T/, ' ').replace(/\..+/, '')
				dataMap[data._id] = scam
			});

			if(!Object.keys(dataMap).length){
				res.header("Content-Type",'application/json');
				res.send(JSON.stringify(JSON.parse('{"message":"no data available, add data first"}'),null,4))
			}else{
			res.header("Content-Type",'application/json');
			res.send(JSON.stringify(dataMap,null,4))
			}
			console.log(dataMap)
		 }
	});
});

// add post request to add task details stuff
app.post('/add', function (req, res){
	console.log(req.body)
	const currd = Date.now()
	const duration = req.body.task_duration
	const data = req.body
	if(data.task_name && data.task_desc && data.task_creator && data.task_duration){
		if(isNaN(Number(duration))){
			res.header("Content-Type",'application/json');
			res.send(JSON.stringify(JSON.parse('{"error":"Duration should be an integer"}'),null,4))
		}else{
			const sc = new schema({
				expireAt : currd + (Number(duration)*60000),
				task_name : req.body.task_name,
				task_desc : req.body.task_desc,
				task_creator : req.body.task_creator,
				task_duration : duration,
				task_createdAt : currd,
			});
			sc.save().then(data => {
				res.header("Content-Type",'application/json');
				res.send(JSON.stringify(data,null,4))
			}).catch(err => {
				console.log(err);
				res.header("Content-Type",'application/json');
				res.send(JSON.stringify(err,null,4))
			});

		}
	}else{
		res.header("Content-Type",'application/json');
		const errorMessage = {}
		errorMessage['error'] = "invalid_fields/some fields missing"
		errorMessage['example'] = JSON.parse('{"task_name": "karma","task_desc": "karma","task_creator": "karma","task_duration": "1"}')
		res.send(JSON.stringify(errorMessage,null,4))
	}
});

// autodelete according to expire Date
var interval = setInterval(function() {
	schema.find({},function(err,list){
		list.forEach(function(data){
			if(data.expireAt < new Date()){
				var id = data._id
				schema.remove({ _id: data._id}, function(err) {
					if (!err) {
						console.log(id+" removed")
					}
					else {
						console.log("error while removing")
					}
				});
			}
		});
	});
  }, 1000);

app.listen(process.env.PORT || 8000, () => console.log('Server started on port 8000'));