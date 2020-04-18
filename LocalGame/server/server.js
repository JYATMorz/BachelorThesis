var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var userNum = 0;

var gameStatus = {
  gameStart: false,
  gameTurn: 0,
  waitNextTurn: false
};
const shootSpeed = 800;

var users = [];
for (var i = 0; i < 4; i++) {
  users.push({
    userSocketID: null,
    userName: 'Default',
    team: {
      teamNum: i,
      player1: {x: null, y: null},
      player2: {x: null, y: null}
    },
    startReady: false,
    turnReady: false,
    position: null
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

    var tempUID;
    for (var i = 0; i < users.length; i++) {
      if (users[i].userSocketID === null) {
        tempUID = i;
        users[i].userSocketID = socket.id;
        break;
      }
    }

    io.sockets.connected[users[0].userSocketID].emit('firstUser', function(teamsData) {
      teamsData.status = {
        gameStart: gameStatus.gameStart,
        gameTurn: gameStatus.gameTurn,
        waitNextTurn: false
      };
      socket.emit('loadData', teamsData);
    });

    socket.emit('currentStates', users);
    socket.broadcast.emit('newUser', users[tempUID]);
  } else {
    console.log("Toooooo many players !!!!");
    socket.emit('over4', socket.id);
  }

  socket.on('disconnect', function() {
    console.log('...Disconnected...');
    for (var i = 0; i < users.length; i++) {
      if (users[i].userSocketID === socket.id) {
        socket.broadcast.emit('playerDown', i);
        users.splice(i, 1, {
          userSocketID: null,
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
    if (userNum === 0) {
      gameStatus.gameTurn = 0;
      gameStatus.gameStart = false;
    }
    io.emit('disconnect', socket.id);
  });

  socket.on('toStartGame', function() {
    var allStartReady = 1;
    users.forEach((user, i) => {
      if (user.userSocketID === socket.id) {
        user.startReady = true;
      } else if (user.userSocketID === null && !user.startReady) {
        user.startReady = true;
        allStartReady ++;
      } else if (user.startReady) {
        allStartReady ++;
      }
    });

    if (allStartReady === 4) {
      gameStatus.gameStart = true;
      io.sockets.emit('startingGame');
    } else {
      io.sockets.emit('waitingGame', allStartReady);
    }
  });

  socket.on('toShootBall', function(playerData) {
    gameStatus.waitNextTurn = true;

    // check data before broadcast !!!
    playerData.speed.x *= shootSpeed;
    playerData.speed.y *= shootSpeed;
    playerData.waitNextTurn = gameStatus.waitNextTurn;
    io.sockets.emit('shootingBall', playerData);
  });

  socket.on('toNextRound', function(endTurnData) {
    var allTurnReady = true;
    users.forEach((user, i) => {
      if (user.userSocketID === socket.id) {
        user.position = endTurnData;
        user.turnReady = true;
      } else {
        if (user.userSocketID === null) {
          user.position = endTurnData;
          user.turnReady = true;
        }
        allTurnReady = allTurnReady && (user.turnReady || (user.userSocketID === null));
      }
    });

    // check all clients position

    if (allTurnReady) {
      gameStatus.gameTurn ++;
      gameStatus.waitNextTurn = false;
      io.sockets.emit('goNextRound', gameStatus);

      // check whether next turn has player, if not, use AI to emit 'shootingBall'
      var teamNum = gameStatus.gameTurn % 4;
      if (users[teamNum].userSocketID === null) {
        gameStatus.waitNextTurn = true;
        var dumbAI = simpleAI(users[teamNum].position, teamNum);
        var playerData = {
          socketID: null,
          teamID: teamNum,
          playerID: dumbAI.playerID,
          speed: dumbAI.speed,
          waitNextTurn: gameStatus.waitNextTurn
        };
        setTimeout(function() {
          io.sockets.emit('shootingBall', playerData);
        }, 5000);
      }
    }
  });


});

server.listen(8081, function() {
  console.log(`Listening on ${server.address().port}`);
});

function simpleAI(position, teamNum) {
  var playerNum = Math.round(Math.random());
  var whichTeam = teamNum % 2;
  var ballPos = {
    x: position[4][0],
    y: position[4][1]
  };
  var playerPos = {
    x: position[teamNum][playerNum][0],
    y: position[teamNum][playerNum][1]
  };
  var doorPos = {};
  if (whichTeam === 0) {
    doorPos = {x: 1000, y: 350};
  } else {
    doorPos = {x: 200, y: 350};
  }

  var playerToTarget = 0;
  if (
    (whichTeam === 0) && (playerPos.x >= ballPos.x) ||
    (whichTeam === 1) && (playerPos.x <= ballPos.x)
  ) {
    playerToTarget = Math.PI -
      Math.atan2((doorPos.y - playerPos.y), (doorPos.x - playerPos.x));
  } else {
    var shootAngle = Math.atan((ballPos.y - doorPos.y), (ballPos.x - doorPos.x));
    var targetPos = {
      x: ballPos.x + Math.cos(shootAngle) * 60,
      y: ballPos.y + Math.sin(shootAngle) * 60
    };
    playerToTarget =
      Math.atan2((targetPos.y - playerPos.y), (targetPos.x - playerPos.x));
  }

  var speed = {
    x: shootSpeed * Math.cos(playerToTarget),
    y: shootSpeed * Math.sin(playerToTarget)
  };

  return {playerID: playerNum,speed: speed};
}
