const gameConfig = {
  type: Phaser.HEADLESS,
  width: 1200, height: 600,
  autoFocus: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {y: 0},
      debug: false
    }
  },
  fps: {min: 25, target: 25, forceSetTimeOut: true},
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const gameSetting = {
  gameArea: {
    x: 200, y: 150, width: 800, height: 400,
    position: {
      team0: 0.175, team1: 0.825, team2: 0.325, team3: 0.675,
      center: 0.25, side: 0.375}
  },
  shootSpeed: 800
};

var gameStatus = {
  gameStart: false,
  gameTurn: 0,
  gameScore: {blue: 0, red: 0},
  waitNextTurn: false,
  turnReady: false,
  goalReady: false
};
var ball, teams, gate;

var userStatus = {userNum: 0, users: []};
for (var i = 0; i < 4; i++) {
  userStatus.users.push({
    userSocketID: null,
    userName: ('Team' + (i + 1)),
    teamNum: i,
    startReady: false,
    turnReady: false,
    goalReady: false
  });
};

function preload() {
  this.load.image('ball', 'image/ball.png');
  this.load.image('player', 'image/player.png');
  this.load.image('goalnet', 'image/playground_2.png');
  this.load.image('goalpost', 'image/playground_3.png');
}

function create() {
  ball = new FootBall(this, gameSetting.gameArea);
  teams = [];
  for (var i = 0; i < 4; i++) {
    teams[i] = new PlayerTeam(this, gameSetting.gameArea, i);
  }
  gate = new GoalGate(this, gameSetting.gameArea);

  teams.forEach((aTeam) => {
    teams.forEach((bTeam) => {
      this.physics.add.collider(aTeam.getChildren(), bTeam.getChildren());
    });
    this.physics.add.collider(aTeam.getChildren(), ball);
    this.physics.add.collider(aTeam.getChildren(), gate.getGoalPost());
  });
  this.physics.add.collider(ball, gate.getGoalPost());

  this.physics.add.overlap(ball, gate.goalNet.left, function() {
    if (gameStatus.gameStart) {
      ballGoal('red');
    }
  });
  this.physics.add.overlap(ball, gate.goalNet.right, function() {
    if (gameStatus.gameStart) {
      ballGoal('blue');
    }
  });

  io.on('connect', function(socket) {
    console.log(socket.id + ' Connected...');

    if (userStatus.userNum < 4) {
      userStatus.userNum ++;
      var gameData = {
        objPosition: getAllObjPosition(),
        gameArea: gameSetting.gameArea,
        teamNum: null,
        gameStatus: gameStatus
      };
      for (var i = 0; i < userStatus.users.length; i++) {
        if (userStatus.users[i].userSocketID === null) {
          userStatus.users[i].userSocketID = socket.id;
          gameData.teamNum = i;
          break;
        }
      }

      socket.emit('loginData', gameData, function(loginData) {
        userStatus.users[gameData.teamNum].userName = loginData.userName;
        socket.emit('currentStates', userStatus.users);
        socket.broadcast.emit('newUser', userStatus.users[gameData.teamNum]);
      });

    } else {
      console.log("Toooooo many players !!!!");
      socket.emit('over4', socket.id);
    }

    socket.on('disconnect', function() {
      console.log('...Disconnected...');
      for (var i = 0; i < userStatus.users.length; i++) {
        if (userStatus.users[i].userSocketID === socket.id) {
          socket.broadcast.emit('playerDown', i);
          userStatus.users.splice(i, 1, {
            userSocketID: null,
            userName: ('Team' + (i + 1)),
            teamNum: i,
            startReady: false,
            turnReady: false,
            goalReady: false
          });
          userStatus.userNum --;
          break;
        }
      }
      if (userStatus.userNum === 0) {
        gameStatus.gameStart = false;
        gameStatus.gameTurn = 0;
        gameStatus.gameScore = {blue: 0, red: 0};
        gameStatus.waitNextTurn = false;
        gameStatus.turnReady = false;
        gameStatus.goalReady = false;
        resetAllPosition();
      } else {
        var aliveUser = {};
        for (var i = 0; i < userStatus.users.length; i++) {
          if (userStatus.users[i].userSocketID !== null) {
            aliveUser.socket = io.sockets.connected[users[i].userSocketID];
            aliveUser.user = userStatus.users[i];
            break;
          }
        }
        if (!gameStatus.gameStart && !gameStatus.goalReady) {
          allStartTest(aliveUser.socket, aliveUser.user.startReady);
        } else {
          if (gameStatus.waitNextTurn && gameStatus.turnReady) {
            allNextTest(aliveUser.socket, aliveUser.user.turnReady);
          }
          if (gameStatus.goalReady && aliveUser.user.goalReady) {
            allGoalTest(aliveUser.socket, aliveUser.user.goalReady);
          }
        }
      }
    });

    socket.on('toStartGame', function(waitStart) {
      allStartTest(socket, waitStart);
    });

    socket.on('toShootBall', function(playerData) {
      gameStatus.waitNextTurn = true;
      shootBall(playerData.teamID, playerData.playerID,
        playerData.speed.x * gameSetting.shootSpeed,
        playerData.speed.y * gameSetting.shootSpeed);
    });

    socket.on('toNextRound', function(turnReady) {
      allNextTest(socket, turnReady);
    });

    socket.on('toGoal', function(teamString) {
      allGoalTest(socket, teamString);
    });

  });
}

function update(time) {
  if (gameStatus.gameStart && !gameStatus.goalReady && gameStatus.waitNextTurn) {
    var syncData = {
      init: false,
      time: Date.now(),
      position: getAllObjPosition()
    };
    io.emit('syncPosition', syncData);

    if (!gameStatus.turnReady) {
      noMovingImgs();
    }
  }
}

const game = new Phaser.Game(gameConfig);
window.gameLoaded();


function getAllObjPosition() {
  var position =
    [ [[], []], // team0: player1[x,y], player2[x,y]
      [[], []], // team1: player1[x,y], player2[x,y]
      [[], []], // team2: player1[x,y], player2[x,y]
      [[], []], // team3: player1[x,y], player2[x,y]
      [] ];     // ball: x,y
  teams.forEach((team, i) => {
    team.getChildren().forEach((player, j) => {
      position[i][j][0] = player.x;
      position[i][j][1] = player.y;
    });
  });
  position[4][0] = ball.x;
  position[4][1] = ball.y;

  return position;
}

function resetAllPosition() {
  ball.resetPosition(gameSetting.gameArea);
  teams.forEach((team, i) => {
    team.resetPosition(gameSetting.gameArea, i);
  });
}

function shootBall(teamID, playerID, velocityX, velocityY) {
  teams[teamID].getChildren()[playerID].setVelocity(velocityX, velocityY);
}

function noMovingImgs() {
  var movingImgs = 0;
  if (ball.body.speed > 0.2) {
    movingImgs ++;
  } else {
    ball.setVelocity(0);
  }
  teams.forEach((team) => {
    team.getChildren().forEach((player) => {
      if (player.body.speed > 0.2) {
        movingImgs ++;
      } else {
        player.setVelocity(0);
      }
    });
  });
  if (gameStatus.waitNextTurn && (movingImgs === 0)) {
    gameStatus.turnReady = true;
    io.emit(
      'nextTurnReady',
      {time: Date.now(), position: getAllObjPosition()}
    );
  }
}

function ballGoal(goalTeam) {
  gameStatus.gameStart = false;
  gameStatus.goalReady = true;
  ball.body.stop();
  teams.forEach((team) => {
    team.getChildren().forEach((player) => {
      player.body.stop();
    });
    team.isSelectedTeam = false;
  });
  var syncData = {
    init: true,
    time: Date.now(),
    position: getAllObjPosition()
  };
  io.emit('syncPosition', syncData);

  if (teamString === 'blue') {
    gameStatus.gameScore.blue ++;
  } else if (teamString === 'red') {
    gameStatus.gameScore.red ++;
  } else {
    console.log('Game Error! Unknown Team!');
  }
}

function allStartTest(socket, startReady) {
  var allStartReady = 0;
  userStatus.users.forEach((user) => {
    if (user.userSocketID === socket.id ||
        (user.userSocketID === null && !user.startReady)) {
      user.startReady = startReady;
    }
    if (user.startReady) {
      allStartReady ++;
    }
  });

  if (allStartReady === 4) {
    gameStatus.gameStart = true;
    io.emit('startingGame');
    userStatus.users.forEach((user) => {
      user.startReady = false;
    });
  } else {
    io.emit('waitingGame', allStartReady);
  }
}

function allNextTest(socket, turnReady) {
  var allTurnReady = true;
  userStatus.users.forEach((user) => {
    if (user.userSocketID === socket.id ||
        user.userSocketID === null) {
      user.turnReady = turnReady;
    }
    allTurnReady = allTurnReady && user.turnReady;
  });

  if (allTurnReady) {
    gameStatus.gameTurn ++;
    gameStatus.waitNextTurn = false;
    gameStatus.turnReady = false;
    io.emit('goNextRound', gameStatus);

    userStatus.users.forEach((user) => {
      user.turnReady = false;
    });

    requestAI();
  }
}

function allGoalTest(socket, goalReady) {
  var allGoalMessage = true;
  userStatus.users.forEach((user) => {
    if (user.userSocketID === socket.id ||
        user.userSocketID === null) {
      user.goalReady = goalReady;
    }
    allGoalMessage = allGoalMessage && user.goalReady;
  });

  if (allGoalMessage) {
    gameStatus.gameTurn = gameStatus.gameScore.blue + gameStatus.gameScore.red - 1;
    gameStatus.goalReady = false;
    setTimeout(function() {
      var syncData = {
        init: true,
        time: Date.now(),
        position: getAllObjPosition()
      };
      io.emit('syncPosition', syncData);
      io.emit('afterGoal', gameStatus);
    }, 5000);
    userStatus.users.forEach((user) => {
      user.goalReady = false;
    });
  }
}

function requestAI() {
  var teamNum = gameStatus.gameTurn % 4;
  if (userStatus.users[teamNum].userSocketID === null) {
    gameStatus.waitNextTurn = true;
    var dumbAI = simpleAI(getAllObjPosition(), teamNum);
    var playerData = {
      socketID: null,
      teamID: teamNum,
      playerID: dumbAI.playerID,
      speed: dumbAI.speed,
      waitNextTurn: gameStatus.waitNextTurn
    };
    setTimeout(function() {
      shootBall(playerData.teamID, playerData.playerID,
        playerData.speed.x, playerData.speed.y);
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
    x: gameSetting.shootSpeed * Math.cos(playerToTarget),
    y: gameSetting.shootSpeed * Math.sin(playerToTarget)
  };

  return {playerID: playerNum, speed: speed};
}
