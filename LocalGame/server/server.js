var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var userNum = 0;

var gameStatus = {
  gameStart: false,
  gameTurn: 0,
  nextRound: false
};

var users = [];
for (var i = 0; i < 4; i++) {
  users.push({
    userID: null,
    userName: 'Default',
    team: {
      teamNum: i,
      player1: {x: null, y: null},
      player2: {x: null, y: null}
    }
  });
}
var initPosition;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  console.log(socket.id + ' Connected...');

  if (userNum < 4) {
    userNum ++;
    for (var i = 0; i < users.length; i++) {
      if (users[i].userID === null) {
        users[i].userID = socket.id;
        break;
      }
    }

    io.sockets.connected[users[0].userID].emit('firstUser', function(teamsData) {
      teamsData.status = {
        gameStart: gameStatus.gameStart,
        gameTurn: gameStatus.gameTurn,
        nextRound: false
      };
      console.log(teamsData);
      socket.emit('loadData', teamsData);
    });
  } else {
    console.log("Toooooo many players !!!!");
    socket.emit('over4', socket.id);
  }

  socket.emit('currentStates', users);
  socket.broadcast.emit('newUser', users[socket.id]);

  socket.on('disconnect', function() {
    console.log('...Disconnected...');
    for (var i = 0; i < users.length; i++) {
      if (users[i].userID === socket.id) {
        users.splice(i, 1, {
          userID: null,
          userName: 'Default',
          team: {
            teamNum: i,
            player1: {x: null, y: null},
            player2: {x: null, y: null}
          }
        });
        userNum --;
      }
    }
    io.emit('disconnect', socket.id);
  });

  socket.on('toShootBall', function(playerData) {
    gameStatus.nextRound = true;

    // check data before broadcast !!!

    playerData.gameTurn = ++ gameStatus.gameTurn;
    playerData.nextRound = gameStatus.nextRound;
    io.sockets.emit('shootingBall', playerData);
  });

  socket.on('toStartGame', function() {
    gameStatus.gameStart = true;
    io.sockets.emit('startingGame');
  });
});

server.listen(8081, function() {
  console.log(`Listening on ${server.address().port}`);
});
