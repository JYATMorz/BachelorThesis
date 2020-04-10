class PlayGame extends Phaser.Scene {
  constructor() {
    super('playGame');
  }

  init() {
    this.gameStart = false;
    this.gameTurn = 0;
    this.nextRound = false;
    this.playground = {
      x: 200, y: 150, width: 800, height: 400,
      position: {a: 0.175, b: 0.325, c: 0.675, d: 0.825},
      tintColor: {blue: 0x1b2350, red: 0xd20808}
    }
    this.generalFont = {
      fontSize: '36px',
      backgroundColor: '#31b696'
    };
    this.shootSpeed = 800;
  }

	preload() {
		this.load.image('ball', 'assets/image/ball.png');
		this.load.image('player', 'assets/image/player.png');
    this.load.image('arrow', 'assets/image/arrow.png');
	}

	create() {
    this.socket = io();
    var self = this;

    this.ball = new Ball(this, this.playground);
    this.add.graphics().lineStyle(5, 0xffffff, 1)
        .strokeRectShape(this.ball.body.customBoundsRectangle);

    this.players = new Array();
		this.players[0] = new PlayerTeam(this, this.playground, 0);
    this.players[1] = new PlayerTeam(this, this.playground, 1);
    this.players[2] = new PlayerTeam(this, this.playground, 2);
    this.players[3] = new PlayerTeam(this, this.playground, 3);

    this.checkCollision(this, this.players, this.ball);

    this.startText = this.add.text(20, 500, 'Start !', this.generalFont);
    this.startText.setInteractive();
    this.startText.on('pointerup', function() {
      if (!this.gameStart) {
        this.socket.emit('toStartGame');
      }
    }, this);

    this.shootText = this.add.text(1020, 500, 'Shoot !', this.generalFont);
    this.shootText.setInteractive();
    this.shootText.on('pointerup', function() {
      if (this.gameStart) {
        var currentTeamNum = this.gameTurn % 4;
        this.players[currentTeamNum].shoot(this.shootSpeed, this.socket);
      }
    }, this);

    this.socket.on('firstUser', function(callback) {
      // wait until (this.nextRound === false)

      var teamsData = {};
      teamsData.position =
        [ [[[], []], [[], []]],
          [[[], []], [[], []]],
          [[[], []], [[], []]],
          [[[], []], [[], []]],
          [[],[]] ];
      self.players.forEach((team, i) => {
        team.getChildren().forEach((player, j) => {
          teamsData.position[i][j][0] = player.x;
          teamsData.position[i][j][1] = player.y;
        });
      });
      teamsData.position[4][0] = self.ball.x;
      teamsData.position[4][1] = self.ball.y;

      callback(teamsData);
    });

    this.socket.once('loadData', function(initData) {
      self.players.forEach((team, i) => {
        team.getChildren().forEach((player, j) => {
          player.setPosition(initData.position[i][j][0], initData.position[i][j][1]);
        });
      });
      self.ball.x = initData.position[4][0];
      self.ball.y = initData.position[4][1];

      self.gameStart = initData.status.gameStart;
      self.gameTurn = initData.status.gameTurn;
      self.nextRound = initData.status.nextRound;

      if (self.gameStart) {
        self.players[self.gameTurn % 4].isTheSelectedTeam();
        self.startText.setText('Team:' + ((self.gameTurn % 4) + 1).toString());
      }
    });

    this.socket.once('startingGame', function() {
      self.players[0].isTheSelectedTeam();
      self.startText.setText('Team:' + (self.gameTurn + 1).toString());
      self.gameStart = true;
    });

    this.socket.once('currentStates', function(users) {
      users.forEach((user, i) => {
        self.updateUser(user);
      });
    });

    this.socket.on('newUser', function(user) {
      self.updateUser(user);
    });

    this.socket.on('over4', function(id) {
      if (id === self.socket.id) {
        // solve problem: 4 more users (dom window alert?)
        console.log('Noooooo Mooooooore Plaaaaaaayers !!!!!!!!');
      }
    });

    this.socket.on('playerDown', function(teamNum) {
      self.players[teamNum].userSocketId = null;
    });

    this.socket.on('shootingBall', function(playerData) {
      self.players.forEach((team, i) => {
        if (
          (playerData.socketID !== null && team.userSocketId === playerData.socketID) ||
          (playerData.socketID === null && i === playerData.teamID)
        ) {
          team.arrow.setVisible(false);
          team.getChildren()[playerData.playerID]
            .body.setVelocity(playerData.speed.x, playerData.speed.y);
          team.getChildren()[playerData.playerID].isSelectedPlayer = false;
          team.isSelectedTeam = false;
          // self.gameTurn = playerData.gameTurn;
          self.nextRound = playerData.nextRound;
        }
      });
    });

    this.socket.on('disconnect', function(socketID) {
      self.players.forEach((team, i) => {
        if (team.userSocketId === socketID) {
          team.userSocketId = null;
        }
      });
    });
	}

	update() {
    this.ball.body.rotation += this.ball.body.speed / 100;

    var movingImgs = 0;
    if (this.ball.body.speed > 0.2) {
      movingImgs ++;
    }
    this.players.forEach((team, i) => {
      team.getChildren().forEach((player, j) => {

        player.updateNameLocation(player.x, player.y);

        if (player.body.speed > 0.2) {
          movingImgs ++;
        }
      });
    });
    if (this.nextRound && movingImgs === 0) {
      this.nextRound = false;
      var nextTeamNum = (this.gameTurn + 1) % 4;
      this.players[nextTeamNum].isTheSelectedTeam();
      this.gameTurn ++;
      this.startText.setText('Team:' + (nextTeamNum + 1).toString());
    }

	}

  checkCollision(scene, teamArray, ballImage) {
    teamArray.forEach((aTeam) => {
      teamArray.forEach((bTeam) => {
        scene.physics.add.collider(aTeam, bTeam);
      });
      scene.physics.add.collider(aTeam, ballImage);
    });
  }

  updateUser(user) {
    var teamNumber = user.team.teamNum;
    if (this.players[teamNumber].userSocketId === null) {
      this.players[teamNumber].userSocketId = user.userID;
      // update user name here
    } else {
      console.log('ErroR: ' + user)
    }
  }
}
