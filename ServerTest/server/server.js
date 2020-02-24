var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var fs = require('fs');
var bodyParser = require('body-parser');
var multer = require('multer');

app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: '/tmp/'}).array('image'));

io.on('connection', function (socket) {
	console.log('a user connected: ', socket.id);
	
	socket.on('disconnect', function () {
		console.log('user disconnected: ', socket.id);
	});
});

app.post('/sending', function (req, res) {
	var time = req.body.time;
	var text = req.body.content;
	var id = req.body.pageid;
	console.log(text);
	var serverDate = new Date();
	var serverTime = serverDate.getTime();
	var latency = serverTime - time;
	io.emit('messages', [latency, serverTime, id]);
	res.end();
});

server.listen(8081, function () {
	console.log("Server on.");
});