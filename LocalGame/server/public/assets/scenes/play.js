class PlayGame extends Phaser.Scene {
  constructor() {
    super('playGame');
  }

  init() {
    this.playground = {
      x: 200, y: 150, width: 800, height: 400,
      position: {a: 0.175, b: 0.325, c: 0.675, d: 0.825}
    }
  }

	preload() {
		this.load.image('ball', 'assets/image/ball.png');
		this.load.image('player', 'assets/image/player.png');
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

    checkCollision(this, this.players, this.ball);
	}

	update() {
    this.ball.body.rotation += this.ball.body.speed / 100;
	}
}

function checkCollision(scene, teamArray, ballImage) {
  teamArray.forEach((aTeam) => {
    teamArray.forEach((bTeam) => {
      scene.physics.add.collider(aTeam, bTeam);
    });
    scene.physics.add.collider(aTeam, ballImage);
  });
}
