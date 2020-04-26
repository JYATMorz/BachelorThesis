import Ball from '../control/football.js';
import PlayerTeam from '../control/team.js';
import PlayArea from '../control/playGround.js'

export default class PlayGame extends Phaser.Scene {
  constructor() {
    super('playGame');
  }

  init(data) {
    this.myUsername = data.userName;

    this.waitStart = false;
    this.gameStart = false;
    this.gameTurn = 0;
    this.gameScore = {blue: 0, red: 0};
    this.waitNextTurn = false;
    this.sendNextTurn = false;
    this.playground = {
      x: 200, y: 150, width: 800, height: 400,
      position: {a: 0.175, b: 0.325, c: 0.675, d: 0.825},
      tintColor: {blue: 0x1b2350, red: 0xd20808}
    };
    this.generalFont = {
      fontSize: '36px',
      backgroundColor: '#31b696',
      align: 'center',
      fixedWidth: 160,
      fixedHeight: 80,
    };
  }

	preload() {
		this.load.image('ball', 'assets/image/ball.png');
		this.load.image('player', 'assets/image/player.png');
    this.load.image('arrow', 'assets/image/arrow.png');
    this.load.image('playground', 'assets/image/playground_1.png');
    this.load.image('goal', 'assets/image/playground_2.png');
    this.load.image('gate', 'assets/image/playground_3.png');
    this.load.bitmapFont('bitter_bmf', 'assets/bitmapFont/bitter.png', 'assets/bitmapFont/bitter.xml');
	}

	create() {
    this.socket = io();
    var self = this;
    this.graphics = this.add.graphics();

    this.background = new PlayArea(this, this.playground);

    this.ball = new Ball(this, this.playground);
    this.graphics.strokeRectShape(this.ball.body.customBoundsRectangle);

    this.players = new Array();
		this.players[0] = new PlayerTeam(this, this.playground, 0);
    this.players[1] = new PlayerTeam(this, this.playground, 1);
    this.players[2] = new PlayerTeam(this, this.playground, 2);
    this.players[3] = new PlayerTeam(this, this.playground, 3);

    this.checkCollision(this, this.players, this.ball, this.background);

    this.startText = this.add.text(20, 400, 'Start !\n0/4', this.generalFont);
    this.startText.setInteractive();
    this.startText.on('pointerup', function() {
      if (!this.gameStart && !this.waitStart) {
        this.waitStart = true;
        this.socket.emit('toStartGame', this.waitStart);
      }
    }, this);

    this.shootText = this.add.text(1020, 400, 'Shoot !', this.generalFont);
    this.shootText.setInteractive();
    this.shootText.on('pointerup', function() {
      if (this.gameStart) {
        var currentTeamNum = this.gameTurn % 4;
        this.players[currentTeamNum].shoot(this.socket);
      }
    }, this);

    this.scoreText = this.add.text(250, 75,
      this.gameScore.blue + ' < Blue : Red  > ' + this.gameScore.red,
      {
        fontSize: '40px',
        color: '#000000',
        stroke: '#212121',
        strokeThickness: 2,
        fixedWidth: 700,
        align: 'center'
      });

    this.titleText = this.add.bitmapText(20, 20, 'bitter_bmf',
      'Simple\nFootball', 42, 1).setTintFill(0x1c3d50);

    this.noteText = this.add.text(1025, 25, 'no new message',
      {
        fontSize: '20px',
        color: '#1b3d4b',
        fixedWidth: 150,
        fixedHeight: 100,
        padding: {x: 4, y: 4}
      });
    this.noteText.setWordWrapWidth(150, true);
    this.graphics.strokeRectShape(this.noteText.getBounds()).lineStyle(3, 0xffffff);

    this.socket.once('loginData', function(gameData, callback) {
      var myTeamNum = gameData.teamNum;
      var myGameData = {userName: self.myUsername, position: null};

      self.updateGameStatus(gameData.gameStatus);

      if (gameData.requestPosition) {
        myGameData.position = self.getAllPosition();
      } else {
        if (gameData.position !== null) {
          self.setAllPosition(gameData.position);
        } else {
          console.log('Error: Where To Go ?!');
        }
      }

      if (self.gameStart) {
        self.players[self.gameTurn % 4].isSelectedTeam = true;
        self.startText.setText('Team:' + ((self.gameTurn % 4) + 1).toString());
        if (self.socket.id === self.players[self.gameTurn % 4].userSocketID) {
          self.noteText.setText('Your Turn');
        } else {
          self.noteText.setText("Other User's Turn");
        }
      }

      callback(myGameData);
    });

    this.socket.once('currentStates', function(users) {
      users.forEach((user, i) => {
        self.updateUser(user);
      });
      self.noteText.setText('Game Loaded');
    });

    this.socket.on('newUser', function(user) {
      self.updateUser(user);
      self.noteText.setText('New User Connected');
    });

    this.socket.on('waitingGame', function(allStartReady) {
      if (self.waitStart) {
        self.startText.setText('Waiting\n' + allStartReady + '/4');
        self.noteText.setText('Waiting For Other Users');
      } else {
        self.startText.setText('Start !\n' + allStartReady + '/4');
        self.noteText.setText('Please Start The Game');
      }
    });

    this.socket.once('startingGame', function() {
      self.players[0].isSelectedTeam = true;
      self.startText.setText('Team:' + (self.gameTurn + 1).toString());
      self.gameStart = true;
      self.noteText.setText('Game Start');
    });

    this.socket.on('over4', function(id) {
      if (id === self.socket.id) {
        self.noteText.setText('Error:\nToo Many Users\nRetry Later');
      }
    });

    this.socket.on('playerDown', function(teamNum) {
      self.players[teamNum].userSocketID = null;
      self.players[teamNum].updateNameText('Team' + (teamNum + 1));
      self.noteText.setText('One User Disconnected');
    });

    this.socket.on('shootingBall', function(playerData) {
      self.players.forEach((team, i) => {
        if (
          (playerData.socketID !== null && team.userSocketID === playerData.socketID) ||
          (playerData.socketID === null && i === playerData.teamID)
        ) {
          team.arrow.setVisible(false);
          team.getChildren()[playerData.playerID]
            .body.setVelocity(playerData.speed.x, playerData.speed.y);
          team.getChildren()[playerData.playerID].isSelectedPlayer = false;
          team.isSelectedTeam = false;
          self.waitNextTurn = playerData.waitNextTurn /*true*/;
        }
      });
    });

    this.socket.on('syncPosition', function(position) {
      self.setAllPosition(position);
    });

    this.socket.on('goNextRound', function(gameStatus) {
      self.waitNextTurn = gameStatus.waitNextTurn;
      self.gameTurn = gameStatus.gameTurn;
      var nextTeamNum = self.gameTurn % 4;
      self.players[nextTeamNum].isSelectedTeam = true;
      self.startText.setText('Team:' + (nextTeamNum + 1).toString());
      self.sendNextTurn = false;

      if (self.socket.id === self.players[nextTeamNum].userSocketID) {
        self.noteText.setText('Your Turn');
      } else {
        self.noteText.setText("Other User's Turn");
      }
    });

    this.socket.on('afterGoal', function(gameStatus) {
      setTimeout(function() {
        self.resetAllPosition(self.playground, gameStatus.rndStepY);
        self.noteText.setText('Game Resume');
        self.updateGameStatus(gameStatus);
      }, 5000);

    });

    this.socket.on('disconnect', function(socketID) {
      self.players.forEach((team, i) => {
        if (team.userSocketID === socketID) {
          team.userSocketID = null;
        }
      });
    });

	}

	update() {
    this.ball.body.rotation += this.ball.body.speed / 100;

    if (this.gameStart) {
      this.noMovingImgs();
    }

	}

  checkCollision(scene, players, ball, doors) {
    players.forEach((aTeam) => {
      players.forEach((bTeam) => {
        scene.physics.add.collider(aTeam.getChildren(), bTeam.getChildren());
      });
      scene.physics.add.collider(aTeam.getChildren(), ball);
      scene.physics.add.collider(aTeam.getChildren(), doors.getDoorChildren());
    });
    scene.physics.add.collider(ball, doors.getDoorChildren());

    scene.physics.add.overlap(ball, doors.getGoalChildren().left, function(ball, leftDoor) {
      if (scene.gameStart) {
        scene.playerGoal('red');
      }
    });
    scene.physics.add.overlap(ball, doors.getGoalChildren().right, function(ball, rightDoor) {
      if (scene.gameStart) {
        scene.playerGoal('blue');
      }
    });
  }

  playerGoal(teamString) {
    this.gameStart = false;
    this.stopAllImages();

    if (teamString === 'blue') {
      this.noteText.setText('Blue Team Goal');
    } else if (teamString === 'red') {
      this.noteText.setText('Red Team Goal');
    } else {
      console.log('Game Error! Unknown Team!');
    }

    this.socket.emit('toGoal', teamString);
  }

  updateGameStatus(gameStatus) {
    this.gameStart = gameStatus.gameStart;
    this.gameTurn = gameStatus.gameTurn;
    this.gameScore = gameStatus.gameScore;
    this.waitNextTurn = gameStatus.waitNextTurn;
    this.scoreText.setText(this.gameScore.blue + ' < Blue : Red  > ' + this.gameScore.red);
  }

  updateUser(user) {
    var teamNumber = user.teamNum;
    if (this.players[teamNumber].userSocketID === null) {
      this.players[teamNumber].userSocketID = user.userSocketID;
      this.players[teamNumber].updateNameText(user.userName);
    } else {
      console.log('Error: ' + user)
    }
  }

  noMovingImgs() {
    var movingImgs = 0;
    if (this.ball.body.speed > 0.2) {
      movingImgs ++;
    } else {
      this.ball.setVelocity(0);
    }
    this.players.forEach((team, i) => {
      team.getChildren().forEach((player, j) => {
        player.updateNameLocation(player.x, player.y);

        if (player.body.speed > 0.2) {
          movingImgs ++;
        } else {
          player.setVelocity(0);
        }
      });
    });
    if (this.waitNextTurn && movingImgs === 0) {
      var endTurnData = {position: this.getAllPosition(), turnReady: true};
      if (!this.sendNextTurn) {
        this.socket.emit('toNextRound', endTurnData);
        this.sendNextTurn = true;
      }
    }
  }

  getAllPosition() {
    var position =
      [ [[], []], // team0: player1[x,y], player2[x,y]
        [[], []], // team1: player1[x,y], player2[x,y]
        [[], []], // team2: player1[x,y], player2[x,y]
        [[], []], // team3: player1[x,y], player2[x,y]
        [] ];     // ball: x,y
    this.players.forEach((team, i) => {
      team.getChildren().forEach((player, j) => {
        position[i][j][0] = player.x;
        position[i][j][1] = player.y;
      });
    });
    position[4][0] = this.ball.x;
    position[4][1] = this.ball.y;

    return position;
  }

  setAllPosition(position) {
    this.players.forEach((team, i) => {
      team.getChildren().forEach((player, j) => {
        player.setPosition(position[i][j][0], position[i][j][1]);
      });
    });
    this.ball.setPosition(position[4][0], position[4][1]);
  }

  resetAllPosition(playground, stepY) {
    this.ball.resetPosition(playground);
    this.players.forEach((team, i) => {
      team.resetPosition(playground, stepY, i);
    });
  }

  stopAllImages() {
    this.ball.body.stop();
    this.players.forEach((team, i) => {
      team.getChildren().forEach((player, i) => {
        player.body.stop();
      });
      team.isSelectedTeam = false;
    });
  }



}
