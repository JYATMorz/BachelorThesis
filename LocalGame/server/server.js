var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var userNum = 0;

var gameStatus = {
  gameStart: false,
  gameTurn: 0,
  gameScore: {blue: 0, red: 0},
  waitNextTurn: false
};
const shootSpeed = 800;

var users = [];
for (var i = 0; i < 4; i++) {
  users.push({
    userSocketID: null,
    userName: ('Team' + (i + 1)),
    teamNum: i,
    startReady: false,
    turnReady: false,
    goalMessage: null,
    position: null
  });
}
var initPosition;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connect', function(socket) {
  console.log(socket.id + ' Connected...');

  if (userNum < 4) {
    userNum ++;
    var gameData = {
      requestPosition: false,
      position: null,
      teamNum: null,
      gameStatus: gameStatus
    };

    if (userNum === 1) {
      gameData.requestPosition = true;
    } else {
      for (var j = 0; j < users.length; j++) {
        if (users[j].userSocketID !== null) {
          gameData.position = users[j].position;
          break;
        }
      }
    }

    for (var i = 0; i < users.length; i++) {
      if (users[i].userSocketID === null) {
        gameData.teamNum = i;
        users[i].userSocketID = socket.id;
        break;
      }
    }

    socket.emit('loginData', gameData, function(loginData) {
      users[gameData.teamNum].userName = loginData.userName;
      if (gameData.requestPosition) {
        if (loginData.position !== null) {
          users[gameData.teamNum].position = loginData.position;
        } else {
          console.log('Error: What To Store ?!');
        }
      }
      socket.emit('currentStates', users);
      socket.broadcast.emit('newUser', users[gameData.teamNum]);
    });

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
          userName: ('Team' + (i + 1)),
          teamNum: i,
          startReady: false,
          turnReady: false,
          goalMessage: null,
          position: null
        });
        userNum --;
      }
    }
    io.emit('disconnect', socket.id);

    if (userNum === 0) {
      gameStatus.gameTurn = 0;
      gameStatus.gameStart = false;
      gameStatus.gameScore = {blue: 0, red: 0},
      gameStatus.waitNextTurn = false;
    } else {
      var aliveUser = {}
      for (var i = 0; i < users.length; i++) {
        if (users[i].userSocketID !== null) {
          aliveUser.socket = io.sockets.connected[users[i].userSocketID];
          aliveUser.user = users[i];
          break;
        }
      }
      if (!gameStatus.gameStart) {
        allStartTest(aliveUser.socket, aliveUser.user.startReady);
      } else {
        if (gameStatus.waitNextTurn) {
          allNextTest(aliveUser.socket,
                      {
                        position: aliveUser.user.position,
                        turnReady: aliveUser.user.turnReady
                      });
        }
        if (aliveUser.user.goalMessage !== null) {
          allGoalTest(aliveUser.socket, aliveUser.user.goalMessage);
        }
      }
    }
  });

  socket.on('toStartGame', function(waitStart) {
    allStartTest(socket, waitStart);
  });

  socket.on('toShootBall', function(playerData) {
    gameStatus.waitNextTurn = true;
    playerData.speed.x *= shootSpeed;
    playerData.speed.y *= shootSpeed;
    playerData.waitNextTurn = gameStatus.waitNextTurn;
    io.sockets.emit('shootingBall', playerData);
  });

  socket.on('toNextRound', function(endTurnData) {
    allNextTest(socket, endTurnData);
  });

  socket.on('toGoal', function(teamString) {
    allGoalTest(socket, teamString);
  });
});

server.listen(8081, function() {
  console.log(`Listening on ${server.address().port}`);
});

function allStartTest(socket, waitStart) {
  var allStartReady = 0;
  users.forEach((user, i) => {
    if (user.userSocketID === socket.id ||
        (user.userSocketID === null && !user.startReady)) {
      user.startReady = waitStart;
    }
    if (user.startReady) {
      allStartReady ++;
    }
  });

  if (allStartReady === 4) {
    gameStatus.gameStart = true;
    io.sockets.emit('startingGame');
    users.forEach((user, i) => {
      user.startReady = false;
    });
  } else {
    io.sockets.emit('waitingGame', allStartReady);
  }
}

function allNextTest(socket, endTurnData) {
  var allTurnReady = true;
  users.forEach((user, i) => {
    if (user.userSocketID === socket.id ||
        user.userSocketID === null) {
      user.position = endTurnData.position;
      user.turnReady = endTurnData.turnReady;
    }
    allTurnReady = allTurnReady && user.turnReady;
  });

  if (allTurnReady) {
    checkAllPosition();

    gameStatus.gameTurn ++;
    gameStatus.waitNextTurn = false;
    io.sockets.emit('goNextRound', gameStatus);

    users.forEach((user, i) => {
      user.turnReady = false;
    });

    requestAI();
  }
}

function allGoalTest(socket, teamString) {
  var allGoalMessage = true;
  users.forEach((user, i) => {
    if (user.userSocketID === socket.id ||
        user.userSocketID === null) {
      user.goalMessage = teamString;
    }
    allGoalMessage = allGoalMessage && (user.goalMessage !== null);
  });

  if (allGoalMessage) {
    var redNum = 0;
    var blueNum = 0;
    users.forEach((user, i) => {
      if (user.goalMessage === 'red') {
        redNum ++;
      } else if (user.goalMessage === 'blue') {
        blueNum ++;
      }
    });
    // need improvement
    if (redNum > blueNum) {
      gameStatus.gameScore.red ++;
    } else if (redNum < blueNum) {
      gameStatus.gameScore.blue ++;
    } else {
      console.log('Error: Both Team Goal');
      gameStatus.gameScore.blue ++;
    }

    gameStatus.rndStepY = Math.floor(Math.random() * 100 * 0.15 ) / 100 + 0.25;
    gameStatus.gameTurn = gameStatus.gameScore.blue + gameStatus.gameScore.red - 1;
    io.sockets.emit('afterGoal', gameStatus);
    users.forEach((user, i) => {
      user.goalMessage = null;
    });
  }
}

// possible bug here
function checkAllPosition() {
  var samePosition = true;
  for (var i = 1; i < users.length; i++) {
    if (JSON.stringify(users[i - 1].position) !== JSON.stringify(users[i].position)) {
      console.log('nope');
      samePosition = false;
      break;
    }
  }

  if (!samePosition) {
    var avgPosition = [[[],[]],[[],[]],[[],[]],[[],[]],[]];
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 2; j++) {
        for (var k = 0; k < 2; k++) {
          avgPosition[i][j][k] = 0.25 *
            (users[0].position[i][j][k] + users[1].position[i][j][k] +
              users[2].position[i][j][k] + users[3].position[i][j][k]);
        }
      }
    }
    for (var k = 0; k < 2; k++) {
      avgPosition[4][k] = 0.25 * (users[0].position[4][k] + users[1].position[4][k]
        + users[2].position[4][k] + users[3].position[4][k]);
    }
    io.sockets.emit('syncPosition', avgPosition);
    for (var i = 0; i < users.length; i++) {
      users[i].position = avgPosition;
    }
  }
}

function requestAI() {
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
      x: ballPos.x + Math.cos(shootAngle) * 50,
      y: ballPos.y + Math.sin(shootAngle) * 50
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
