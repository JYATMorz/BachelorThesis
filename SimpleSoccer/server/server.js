const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const os = require('os');

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

function gameLoaded() {
  server.listen(8081, function() {
    console.log(`Listening on ${server.address().port}`);
    console.log(getLocalIP());
  });
  return `Server on ${getLocalIP()}:${server.address().port}`;
}

function getLocalIP() {
  var networkInterface = os.networkInterfaces();
  var ipAddress = 'error.error.error.error';

  Object.keys(networkInterface).forEach((networkName) => {
    networkInterface[networkName].forEach((ipconfig) => {
      if (ipconfig.family === 'IPv4' && ipconfig.internal === false) {
        ipAddress = ipconfig.address;
      }
    });
  });
  return ipAddress;
}
