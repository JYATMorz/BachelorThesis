class SoccerPlayer extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, playground) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.7);
    this.body.setCircle(50);
    this.body.setBounce(1);
    this.body.setMass(10);
    this.body.setCollideWorldBounds(true);
    this.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(
        playground.x, playground.y, playground.width, playground.height));
    this.body.useDamping = true;
    this.body.setDrag(0.95);
    this.body.setMaxSpeed(600);
  }
}
