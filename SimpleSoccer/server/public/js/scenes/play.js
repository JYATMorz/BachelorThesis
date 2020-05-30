import PlayerTeam from '../objects/team.js';
import PlayArea from '../objects/playGround.js'

export default class PlayGame extends Phaser.Scene {
  constructor() {
    super('playGame');
  }

  init(data) {
    this.myUsername = data.userName;
    this.lastTimeStamp = 0;
    this.myTeamNum = null;
    this.waitStart = false;
    this.gameStart = false;
    this.gameTurn = 0;
    this.gameScore = {blue: 0, red: 0};
    this.waitNextTurn = false;
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
    this.load.image('goaltext', 'assets/image/goal.png');
    this.load.bitmapFont('bitter_bmf', 'assets/bitmapFont/bitter.png', 'assets/bitmapFont/bitter.xml');
	}

	create() {
    // socket.io methods
    this.socket = io();
    this.socket.once('loginData', (gameData, callback) => {
      var myGameData = {userName: this.myUsername};

      this.gameArea = gameData.gameArea;
      this.myTeamNum = gameData.teamNum;
      this.updateGameStatus(gameData.gameStatus);
      this.setAllPosition(gameData.objPosition, false);

      callback(myGameData);
    });

    // phaser 3 methods
    if (this.gameArea !== null) {
      this.background = new PlayArea(this, this.gameArea);

      this.ball = this.add.image(
        this.gameArea.x + this.gameArea.width / 2,
        this.gameArea.y + this.gameArea.height / 2,
        'ball').setScale(0.5);

      this.teams = new Array();
      this.teams[0] = new PlayerTeam(this, this.gameArea, 0);
      this.teams[1] = new PlayerTeam(this, this.gameArea, 1);
      this.teams[2] = new PlayerTeam(this, this.gameArea, 2);
      this.teams[3] = new PlayerTeam(this, this.gameArea, 3);
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
      if (this.gameStart && this.teams[this.myTeamNum].isSelectedTeam) {
        this.teams[this.myTeamNum].shoot(this.socket);
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

    this.particles = this.add.particles('ball');
    this.goalText = this.add.image(600, 300, 'goaltext').setVisible(false);
    this.goalSquare = this.particles.createEmitter({
      x: {min: 500, max: 700},
      y: {min: 275, max: 325},
      lifespan: 4000,
      speed: {min: 400, max: 650},
      angle: {min: 210, max: 330},
      gravityY: 500,
      scale: { start: 0.2, end: 0 },
      quantity: 4,
      blendMode: 'ADD',
      tint: [0x00d1ff, 0xffed00, 0xff0000],
      on: false
    });
    this.goalRain = this.particles.createEmitter({
      speed: 0,
      lifespan: 750,
      quantity: 2,
      scale: 0.1,
      blendMode: 'SCREEN',
      tint: 0xf6ff4d,
      emitZone: {
        type: 'edge',
        source: this.goalText.getBounds(),
        quantity: 50
      },
      on: false
    });

    // socket.io methods
    this.socket.once('currentStates', (users) => {
      users.forEach((user, i) => {
        this.updateUser(user);
      });
      this.noteText.setText('Game Loaded');

      if (this.gameStart) {
        if (this.teams[this.gameTurn % 4].userSocketID === this.socket.id) {
          this.teams[this.gameTurn % 4].isSelectedTeam = true;
        }
        this.startText.setText('Team:' + ((this.gameTurn % 4) + 1).toString());
        if (this.socket.id === this.teams[this.gameTurn % 4].userSocketID) {
          this.noteText.setText('Your Turn');
        } else {
          this.noteText.setText("Other User's Turn");
        }
      }
    });

    this.socket.on('newUser', (user) => {
      this.updateUser(user);
      this.noteText.setText('New User Connected');
    });

    this.socket.on('over4', (id) => {
      if (id === this.socket.id) {
        this.noteText.setText('Error:\nToo Many Users\nRetry Later');
      }
    });

    this.socket.on('waitingGame', (allStartReady) => {
      if (this.waitStart) {
        this.startText.setText('Waiting\n' + allStartReady + '/4');
        this.noteText.setText('Waiting For Other Users');
      } else {
        this.startText.setText('Start !\n' + allStartReady + '/4');
        this.noteText.setText('Please Start The Game');
      }
    });

    this.socket.once('startingGame', () => {
      if (this.teams[0].userSocketID === this.socket.id) {
        this.teams[0].isSelectedTeam = true;
      }
      this.startText.setText('Team:' + (this.gameTurn + 1).toString());
      this.gameStart = true;
      this.noteText.setText('Game Start');
    });

    this.socket.on('playerDown', (teamNum) => {
      this.teams[teamNum].userSocketID = null;
      this.teams[teamNum].updateNameText('Team' + (teamNum + 1));
      this.noteText.setText('One User Disconnected');
    });

    this.socket.on('syncPosition', (syncData) => {
      if (this.lastTimeStamp < syncData.time) {
        this.setAllPosition(syncData.position, syncData.goal);
        this.lastTimeStamp = syncData.time;
      }
      if (syncData.goal) {
        this.noteText.setText('Goal !!!');

        this.goalRain.start();
        this.goalSquare.start();
        this.goalText.setVisible(true);
        setTimeout(() => {
          this.goalRain.stop();
          this.goalSquare.stop();
          this.goalText.setVisible(false);
        }, 4000);
      }
    });

    this.socket.on('nextTurnReady', (turnData) => {
      this.setAllPosition(turnData.position, false);
      this.socket.emit('toNextRound', true);
    });

    this.socket.on('goNextRound', (gameStatus) => {
      this.gameTurn = gameStatus.gameTurn;
      var nextTeamNum = this.gameTurn % 4;
      if (this.teams[nextTeamNum].userSocketID === this.socket.id) {
        this.teams[nextTeamNum].isSelectedTeam = true;
      } else if (this.teams[nextTeamNum].userSocketID !== null) {
        this.waitNextTurn = gameStatus.waitNextTurn;
      }
      this.startText.setText('Team:' + (nextTeamNum + 1).toString());

      if (this.socket.id === this.teams[nextTeamNum].userSocketID) {
        this.noteText.setText('Your Turn');
      } else {
        this.noteText.setText("Other User's Turn");
      }
    });

    this.socket.on('afterGoal', (gameStatus) => {
      this.noteText.setText('Game Resume');
      this.updateGameStatus(gameStatus);
      this.socket.emit('toNextRound', true);
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
  setAllPosition(position, initial) {
    this.teams.forEach((team, i) => {
      team.getChildren().forEach((player, j) => {
        player.setPosition(position[i][j][0], position[i][j][1]);
      });
    });
    this.ball.setPosition(position[4][0], position[4][1]);
  }


}
