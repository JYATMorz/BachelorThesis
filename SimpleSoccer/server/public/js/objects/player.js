export default class SoccerPlayer extends Phaser.GameObjects.Image {

  constructor(scene, x, y, gameArea) {
    super(scene, x, y, 'player');

    scene.add.existing(this);

    this.setScale(0.7);
    this.setInteractive(
      new Phaser.Geom.Circle(50, 50, 50),
      Phaser.Geom.Circle.Contains
    );

    this.isSelectedPlayer = false;
    this.name = scene.add.bitmapText(
      x, y - 0.5 * this.height, 'bitter_bmf', 'name', 18
    ).setOrigin(0.5).setTintFill(0xffffff);
  }

  updateNameLocation(newX, newY) {
    this.name.setPosition(newX, newY - 0.5 * this.height);
  }
}
