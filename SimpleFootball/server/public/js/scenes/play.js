import PlayerTeam from '../objects/team.js';
import PlayArea from '../objects/playGround.js'

export default class PlayGame extends Phaser.Scene {
  constructor() {
    super('playGame');
  }

  init(data) {
    this.myUsername = data.userName;
    this.lastTimeStamp = 0;

    this.waitStart = false;
    this.gameStart = false;
    this.gameTurn = 0;
    this.gameScore = {blue: 0, red: 0};
    this.waitNextTurn = false;
    this.sendNextTurn = false;
    this.gameArea = {
      x: 200, y: 150, width: 800, height: 400,
      position: {
        team0: 0.175, team1: 0.825, team2: 0.325, team3: 0.675,
        center: 0.25, side: 0.375}
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
    this.load.image('goalnet', 'assets/image/playground_2.png');
    this.load.image('goalpost', 'assets/image/playground_3.png');
    this.load.bitmapFont('bitter_bmf', 'assets/bitmapFont/bitter.png', 'assets/bitmapFont/bitter.xml');
	}

	create() {
    // socket.io methods
    this.socket = io();
    var self = this;
    this.socket.once('loginData', function(gameData, callback) {
      var myGameData = {userName: self.myUsername};

      self.gameArea = gameData.gameArea;
      self.updateGameStatus(gameData.gameStatus);
      self.setAllPosition(gameData.objPosition, 0, true);

      callback(myGameData);
    });

    // phaser 3 methods
    if (this.gameArea !== null) {
      this.background = new PlayArea(this, this.gameArea);

      this.ball = this.physics.add.image(
        this.gameArea.x + this.gameArea.width / 2,
        this.gameArea.y + this.gameArea.height / 2,
        'ball').setScale(0.5);

      this.teams = new Array();
      this.teams[0] = new PlayerTeam(this, this.gameArea, 0);
      this.teams[1] = new PlayerTeam(this, this.gameArea, 1);
      this.teams[2] = new PlayerTeam(this, this.gameArea, 2);
      this.teams[3] = new PlayerTeam(this, this.gameArea, 3);

      this.physics.add.overlap(
        this.ball, this.background.goalNet.left, function() {
          if (scene.gameStart) {
            scene.playerGoal('red');
          }
        });
      this.physics.add.overlap(
        this.ball, this.background.goalNet.right, function() {
          if (scene.gameStart) {
            scene.playerGoal('red');
          }
        });
    }

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
        this.teams[currentTeamNum].shoot(this.socket);
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
    this.graphics = this.add.graphics()
      .strokeRectShape(this.noteText.getBounds())
      .lineStyle(3, 0xffffff);

    // socket.io methods
    this.socket.once('currentStates', function(users) {
      users.forEach((user, i) => {
        self.updateUser(user);
      });
      self.noteText.setText('Game Loaded');

      if (self.gameStart) {
        self.teams[self.gameTurn % 4].isSelectedTeam = true;
        self.startText.setText('Team:' + ((self.gameTurn % 4) + 1).toString());
        if (self.socket.id === self.teams[self.gameTurn % 4].userSocketID) {
          self.noteText.setText('Your Turn');
        } else {
          self.noteText.setText("Other User's Turn");
        }
      }
    });

    this.socket.on('newUser', function(user) {
      self.updateUser(user);
      self.noteText.setText('New User Connected');
    });

    this.socket.on('over4', function(id) {
      if (id === self.socket.id) {
        self.noteText.setText('Error:\nToo Many Users\nRetry Later');
      }
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
      self.teams[0].isSelectedTeam = true;
      self.startText.setText('Team:' + (self.gameTurn + 1).toString());
      self.gameStart = true;
      self.noteText.setText('Game Start');
    });

    this.socket.on('playerDown', function(teamNum) {
      self.teams[teamNum].userSocketID = null;
      self.teams[teamNum].updateNameText('Team' + (teamNum + 1));
      self.noteText.setText('One User Disconnected');
    });

    this.socket.on('syncPosition', function(syncData) {
      if (self.lastTimeStamp < syncData.time) {
        var deltaTime = syncData.time - self.lastTimeStamp;
        self.setAllPosition(syncData.position, deltaTime, syncData.init);
        self.lastTimeStamp = syncData.time;
      }
    });

    this.socket.on('nextTurnReady', function(turnData) {
      self.setAllPosition(turnData.position, (Date.now() - turnData.time), false);
      self.socket.emit('toNextRound', true);
    });

    this.socket.on('goNextRound', function(gameStatus) {
      self.waitNextTurn = gameStatus.waitNextTurn;
      self.gameTurn = gameStatus.gameTurn;
      var nextTeamNum = self.gameTurn % 4;
      self.teams[nextTeamNum].isSelectedTeam = true;
      self.startText.setText('Team:' + (nextTeamNum + 1).toString());
      self.sendNextTurn = false;

      if (self.socket.id === self.teams[nextTeamNum].userSocketID) {
        self.noteText.setText('Your Turn');
      } else {
        self.noteText.setText("Other User's Turn");
      }
    });

    this.socket.on('afterGoal', function(gameStatus) {
      self.noteText.setText('Game Resume');
      self.updateGameStatus(gameStatus);
    });



	}

	update() {
    if (this.gameStart) {
      this.teams.forEach((team, i) => {
        team.getChildren().forEach((player, j) => {
          player.updateNameLocation(player.x, player.y);
        });
      });
    }

	}

  /*
  * tell server the client is waiting for goal result
  */
  playerGoal(teamString) {
    this.gameStart = false;

    if (teamString === 'blue') {
      this.noteText.setText('Blue Team Goal');
    } else if (teamString === 'red') {
      this.noteText.setText('Red Team Goal');
    } else {
      console.log('Game Error! Unknown Team!');
    }

    this.socket.emit('toGoal', teamString);
  }

  /*
  * update game status with given data
  */
  updateGameStatus(gameStatus) {
    this.gameStart = gameStatus.gameStart;
    this.gameTurn = gameStatus.gameTurn;
    this.gameScore = gameStatus.gameScore;
    this.waitNextTurn = gameStatus.waitNextTurn;
    this.scoreText.setText(this.gameScore.blue + ' < Blue : Red  > ' + this.gameScore.red);
  }

  /*
  * update one team's userSocketID and userName with given user data
  */
  updateUser(user) {
    var teamNumber = user.teamNum;
    if (this.teams[teamNumber].userSocketID === null) {
      this.teams[teamNumber].userSocketID = user.userSocketID;
      this.teams[teamNumber].updateNameText(user.userName);
    } else {
      console.log('Error: ' + user)
    }
  }

  /*
  * get the position of 4 teams and 1 ball in the order of
  *   team0: player1[x,y], player2[x,y]
  *   team1: player1[x,y], player2[x,y]
  *   team2: player1[x,y], player2[x,y]
  *   team3: player1[x,y], player2[x,y]
  *   ball: x,y
  */
  getAllPosition() {
    var position =
      [ [[],[]], [[],[]], [[],[]], [[],[]], [] ];
    this.teams.forEach((team, i) => {
      team.getChildren().forEach((player, j) => {
        position[i][j][0] = player.x;
        position[i][j][1] = player.y;
      });
    });
    position[4][0] = this.ball.x;
    position[4][1] = this.ball.y;

    return position;
  }

  /*
  * set the position of 4 teams and 1 ball with given position
  */
  setAllPosition(position, deltaTime, initial) {
    if (initial) {
      this.teams.forEach((team, i) => {
        team.getChildren().forEach((player, j) => {
          player.setPosition(position[i][j][0], position[i][j][1]);
        });
      });
      this.ball.setPosition(position[4][0], position[4][1]);
    } else {
      this.teams.forEach((team, i) => {
        team.getChildren().forEach((player, j) => {
          this.physics.moveTo(player, position[i][j][0], position[i][j][1], 0, deltaTime);
        });
      });
      this.physics.moveTo(this.ball, position[4][0], position[4][1], 0, deltaTime);
    }
  }


}
