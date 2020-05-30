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
  parent: "phaser",
  dom: {
    createContainer: true
  },
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
var ball, teams, gate, domElement;
var serverStatus = ['Server Status :\n'];
const css = 'color: white; font-size: 20px; white-space:pre-line';

var userStatus = {userNum: 0, users: []};
for (var i = 0; i < 4; i++) {
  userStatus.users.push({
    userSocketID: null,
    userName: ('Team' + (i + 1)),
    teamNum: i,
    startReady: false,
    turnReady: false,
  });
};

function preload() {
  this.load.image('ball', 'physic_server/image/ball.png');
  this.load.image('player', 'physic_server/image/player.png');
  this.load.image('goalnet', 'physic_server/image/playground_2.png');
  this.load.image('goalpost', 'physic_server/image/playground_3.png');
}

function create() {
  ball = new FootBall(this, gameSetting.gameArea);
  teams = [];
  for (var i = 0; i < 4; i++) {
    teams[i] = new PlayerTeam(this, gameSetting.gameArea, i);
  }
  gate = new GoalGate(this, gameSetting.gameArea);

  domElement = this.add.dom(0, 0).createElement('p', css, serverStatus.toString());

  teams.forEach((aTeam) => {
    teams.forEach((bTeam) => {
      this.physics.add.collider(aTeam.getChildren(), bTeam.getChildren());
    });
    this.physics.add.collider(aTeam.getChildren(), ball);
    this.physics.add.collider(aTeam.getChildren(), gate.getGoalPost());
  });
  this.physics.add.collider(ball, gate.getGoalPost());

  this.physics.add.overlap(ball, gate.goalNet.left, () => {
    if (gameStatus.gameStart) {
      ballGoal('red');
    }
  });
  this.physics.add.overlap(ball, gate.goalNet.right, () => {
    if (gameStatus.gameStart) {
      ballGoal('blue');
    }
  });

  io.on('connect', (socket) => {
    console.log('New User Connected:');

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

      socket.emit('loginData', gameData, (loginData) => {
        userStatus.users[gameData.teamNum].userName = loginData.userName;

        console.log('Welcome ' + loginData.userName);
        array_print('New user connected: Hello, ' + loginData.userName);

        socket.emit('currentStates', userStatus.users);
        socket.broadcast.emit('newUser', userStatus.users[gameData.teamNum]);
      });

    } else {
      console.log("Toooooo many players !!!!");
      array_print('One user is rejected');

      socket.emit('over4', socket.id);
    }

    socket.on('disconnect', () => {
      console.log('One User Disconnected:');

      for (var i = 0; i < userStatus.users.length; i++) {
        if (userStatus.users[i].userSocketID === socket.id) {
          console.log("Goodbye " + userStatus.users[i].userName);
          array_print('One user disconnected: Goodbye ' + userStatus.users[i].userName);

          socket.broadcast.emit('playerDown', i);
          userStatus.users.splice(i, 1, {
            userSocketID: null,
            userName: ('Team' + (i + 1)),
            teamNum: i,
            startReady: false,
            turnReady: false,
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
            aliveUser.socket = io.sockets.connected[userStatus.users[i].userSocketID];
            aliveUser.user = userStatus.users[i];
            break;
          }
        }
        if (!gameStatus.gameStart && !gameStatus.goalReady) {
          allStartTest(aliveUser.socket, aliveUser.user.startReady);
        } else {
          if (!gameStatus.waitNextTurn && !gameStatus.turnReady) {
            allNextTest(aliveUser.socket, "disconnect");
          }
        }
      }
    });

    socket.on('toStartGame', (waitStart) => {
      allStartTest(socket, waitStart);
    });

    socket.on('toShootBall', (playerData) => {
      if (socket.id === playerData.socketID) {
        gameStatus.waitNextTurn = true;
        shootBall(playerData.teamID, playerData.playerID,
          playerData.speed.x * gameSetting.shootSpeed,
          playerData.speed.y * gameSetting.shootSpeed);
      } else {
        console.log('Not correct user !');
      }
    });

    socket.on('toNextRound', (turnReady) => {
      if (turnReady) {
        allNextTest(socket, "turnReady");
      }
    });

  });
}

function update(time) {
  if (gameStatus.gameStart && !gameStatus.goalReady && !gameStatus.turnReady) {
    var syncData = {
      goal: false,
      time: Date.now(),
      position: getAllObjPosition()
    };
    io.emit('syncPosition', syncData);

    if (!gameStatus.turnReady) {
      noMovingImgs();
    }
  }
}

const loadGame = new Promise((resolve, reject) => {
  const game = new Phaser.Game(gameConfig);
  resolve(gameLoaded());
});
loadGame.then((str) => array_print(str)).catch((err) => console.log(err));


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
  array_print('Positions reset')
}

function shootBall(teamID, playerID, velocityX, velocityY) {
  teams[teamID].getChildren()[playerID].setVelocity(velocityX, velocityY);
  array_print(`${userStatus.users[teamID].userName} ${playerID + 1} is shooting`);
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

function ballGoal(teamString) {
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
    goal: true,
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
  array_print(`Score => blue > ${gameStatus.gameScore.blue} : ${gameStatus.gameScore.red} < red`);

  setTimeout(() => {
    resetAllPosition();
    gameStatus.gameTurn = gameStatus.gameScore.blue + gameStatus.gameScore.red;
    gameStatus.goalReady = false;
    gameStatus.gameStart = true;
    var syncData = {
      goal: false,
      time: Date.now(),
      position: getAllObjPosition()
    };
    io.emit('syncPosition', syncData);
    io.emit('afterGoal', gameStatus);

    array_print('Game resume');
  }, 5000);
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
    array_print('Game start');
  } else {
    io.emit('waitingGame', allStartReady);
    array_print('Ready user number: ' + allStartReady);
  }
}

function allNextTest(socket, flag) {
  if (flag === "turnReady") {
    var allTurnReady = true;
    userStatus.users.forEach((user) => {
      if (user.userSocketID === socket.id || user.userSocketID === null) {
        user.turnReady = true;
      }
      allTurnReady = allTurnReady && user.turnReady;
    });

    if (allTurnReady && gameStatus.gameStart) {
      gameStatus.gameTurn ++;
      gameStatus.waitNextTurn = false;
      gameStatus.turnReady = false;
      io.emit('goNextRound', gameStatus);

      userStatus.users.forEach((user) => {
        user.turnReady = false;
      });

      requestAI();
    }
  } else if (flag === "disconnect") {
    requestAI();
  }
}

function requestAI() {
  var teamNum = gameStatus.gameTurn % 4;
  if (userStatus.users[teamNum].userSocketID === null) {
    gameStatus.waitNextTurn = true;
    var dumbAI = simpleAI(getAllObjPosition(), teamNum);
    shootBall(teamNum, dumbAI.playerID, dumbAI.speed.x, dumbAI.speed.y);
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
      x: ballPos.x + Math.cos(shootAngle) * 55,
      y: ballPos.y + Math.sin(shootAngle) * 55
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

function array_print(text) {
  if (serverStatus.length >= 21) {
    serverStatus.splice(2, 1);
  }
  serverStatus.push('\n' + text);
  domElement.setText(serverStatus.toString());
}
