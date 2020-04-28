class SoccerPlayer extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, gameArea) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.7);
    this.body.setCircle(50);
    this.body.setBounce(1);
    this.body.setMass(1);
    this.body.setCollideWorldBounds(true);
    this.body.useDamping = true;
    this.body.setDrag(0.97);
    this.body.setMaxSpeed(800);
    this.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(
        gameArea.x, gameArea.y, gameArea.width, gameArea.height
      ));
    this.isSelectedPlayer = false;
  }

}
