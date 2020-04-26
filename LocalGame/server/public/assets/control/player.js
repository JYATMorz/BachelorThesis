export default class SoccerPlayer extends Phaser.Physics.Arcade.Image {

  constructor(scene, x, y, playground) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.7);
    this.body.setCircle(50);
    this.body.setBounce(1);
    this.body.setMass(1);
    this.body.setCollideWorldBounds(true);
    this.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(
        playground.x, playground.y, playground.width, playground.height));
    this.body.useDamping = true;
    this.body.setDrag(0.97);
    this.body.setMaxSpeed(800);

    this.isSelectedPlayer = false;

    this.setInteractive(new Phaser.Geom.Circle(50, 50, 50), Phaser.Geom.Circle.Contains);

    this.name = scene.add.bitmapText(x, y - 0.5 * this.height, 'bitter_bmf', 'name', 18)
      .setOrigin(0.5).setTintFill(0xffffff);
  }

  updateNameLocation(newX, newY) {
    this.name.setPosition(newX, newY - 0.5 * this.height);
  }
}
