class SoccerPlayer extends Phaser.Physics.Arcade.Image {

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
    this.body.setDrag(0.96);
    this.body.setMaxSpeed(800);

    this.arrow = scene.add.image(x, y, 'arrow').setOrigin(0, 0.5).setVisible(false);
    this.arrow.setInteractive();

    this.setInteractive(new Phaser.Geom.Circle(50, 50, 50), Phaser.Geom.Circle.Contains);
    this.on('pointerup',  function() {
      this.adjustForce(scene, this.arrow);
    });
  }

  adjustForce(scene, arrow) {
    var centerX = this.x + arrow.width;
    var centerY = this.y;

    arrow.setPosition(this.x, this.y);

    arrow.on('pointerdown', function(pointer) {
      scene.input.mouse.requestPointerLock();
    });

    scene.input.on('pointermove', function(pointer) {
      if (scene.input.mouse.locked) {
        centerX += pointer.movementX;
        centerY += pointer.movementY;
        arrow.setRotation(Phaser.Math.Angle.Between(this.x, this.y, centerX, centerY));

        var distance = Phaser.Math.Distance.Between(this.x, this.y, centerX, centerY) / 100;
        if (distance < 0.2) {
          arrow.setScale(0.2, 1);
        } else if (distance > 2) {
          arrow.setScale(2, 1);
        } else {
          arrow.setScale(distance, 1);
        }
      }
    });

    scene.input.on('pointerup', function(pointer) {
      scene.input.mouse.releasePointerLock();
      centerX = this.x + arrow.width;
      centerY = this.y;
    });

    arrow.setVisible(true);
  }
}
