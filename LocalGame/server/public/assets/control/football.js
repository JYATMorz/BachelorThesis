class Ball extends Phaser.Physics.Arcade.Image {
  constructor(scene, playground) {
    super(scene, playground.x + playground.width / 2,
      playground.y + playground.height / 2, 'ball');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.5);
    this.body.setCircle(50);
		this.body.setBounce(1);
		this.body.setMass(1);
		this.body.setCollideWorldBounds(true);
    this.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(
        playground.x, playground.y, playground.width, playground.height));
		this.body.useDamping = true;
		this.body.setDrag(0.99);
		this.body.setMaxSpeed(2000);

  }

  resetPosition(playground) {
    this.setPosition(playground.x + playground.width / 2,
      playground.y + playground.height / 2);
  }
}
