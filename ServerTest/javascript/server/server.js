var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({ extended: false });
 
app.use('/public', express.static('public'));
 
app.get('/index.html', function (req, res) {
   res.sendFile("D:/GitHub/BachelorThesis/ServerTest/ChatRoom.html");
})
 
app.post('/sending', urlencodedParser, function (req, res) {
   var time = req.body.time;
   var text = req.body.content;
   console.log(text);
   var serverDate = new Date();
   var serverTime = serverDate.getTime();
   var latency = serverTime - time;
   res.send([latency, serverTime]);
})
 
var server = app.listen(8081, function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("Address: http://%s:%s", host, port)
 
})