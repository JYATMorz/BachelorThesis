class PlayGame extends Phaser.Scene {
  constructor() {
    super('playGame');
  }

  init() {
    this.gameStart = false;
    this.gameTurn = 0;
    this.playground = {
      x: 200, y: 150, width: 800, height: 400,
      position: {a: 0.175, b: 0.325, c: 0.675, d: 0.825}
    }
    this.generalFont = {
      fontSize: '36px',
      backgroundColor: '#31b696'
    };
  }

	preload() {
		this.load.image('ball', 'assets/image/ball.png');
		this.load.image('player', 'assets/image/player.png');
    this.load.image('arrow', 'assets/image/arrow.png');
	}

	create() {
    this.ball = new Ball(this, this.playground);
    this.add.graphics().lineStyle(5, 0x00ffff, 0.8)
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
        this.players[0].isTheSelectedTeam();
        this.startText.setText('Team:' + (this.gameTurn + 1).toString());
        this.gameStart = true;
      }
    }, this);

    this.shootText = this.add.text(1020, 500, 'Shoot !', this.generalFont);
    this.shootText.setInteractive();
    this.shootText.on('pointerup', function() {
      if (this.gameStart) {
        var currentTeamNum = this.gameTurn % 4;
        var nextTeamNum = (this.gameTurn + 1) % 4;

        this.players[currentTeamNum].shoot();

        this.players[nextTeamNum].isTheSelectedTeam();
        this.gameTurn ++;
        this.startText.setText('Team:' + (nextTeamNum + 1).toString());
      }
    }, this);
	}

	update() {
    this.ball.body.rotation += this.ball.body.speed / 100;

    this.players.forEach((team, i) => {
      team.getChildren().forEach((player, j) => {
        player.updateNameLocation(player.x, player.y);
      });
    });

	}

  checkCollision(scene, teamArray, ballImage) {
    teamArray.forEach((aTeam) => {
      teamArray.forEach((bTeam) => {
        scene.physics.add.collider(aTeam, bTeam);
      });
      scene.physics.add.collider(aTeam, ballImage);
    });
  }
}
