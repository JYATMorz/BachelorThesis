class FootBall extends Phaser.Physics.Arcade.Image {
  constructor(scene, gameArea) {
    super(scene, gameArea.x + gameArea.width / 2,
      gameArea.y + gameArea.height / 2, 'ball');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.5);
    this.body.setCircle(50);
		this.body.setBounce(1);
		this.body.setMass(5);
		this.body.useDamping = true;
		this.body.setDrag(0.99);
		this.body.setMaxSpeed(2000);
    this.body.setCollideWorldBounds(true);
    this.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(
        gameArea.x, gameArea.y, gameArea.width, gameArea.height
      )
    );
  }

  resetPosition(gameArea) {
    this.setPosition(
      gameArea.x + gameArea.width / 2,
      gameArea.y + gameArea.height / 2,
    );
  }

}
