var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var multer = require('multer');

app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: '/tmp/'}).array('image'));
 
app.post('/sending', function (req, res) {
	var time = req.body.time;
	var text = req.body.content;
	console.log(text);
	var serverDate = new Date();
	var serverTime = serverDate.getTime();
	var latency = serverTime - time;
	res.send([latency, serverTime]);
})
 
var server = app.listen(8081, function () {
	console.log("Server on.");
});