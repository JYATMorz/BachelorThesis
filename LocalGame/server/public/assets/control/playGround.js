export default class PlayArea{

  constructor(scene, playground) {
    var centerX = playground.x + playground.width / 2;
    var centerY = playground.y + playground.height / 2;
    var gateX = {
      left: playground.x,
      right: playground.x + playground.width
    }
    var gateY = {
      up: playground.y + playground.height * 0.375,
      down: playground.y + playground.height * 0.625
    }

    this.background = scene.add.image(centerX, centerY, 'playground');
    this.gate = {
      left: {
        up: scene.physics.add.staticImage(gateX.left, gateY.up, 'gate').setOrigin(0, 0.5).refreshBody(),
        down: scene.physics.add.staticImage(gateX.left, gateY.down, 'gate').setOrigin(0, 0.5).refreshBody(),
        bottom: scene.physics.add.staticImage(gateX.left, centerY, 'goal').setOrigin(0, 0.5).refreshBody()
      },
      right: {
        up: scene.physics.add.staticImage(gateX.right, gateY.up, 'gate').setOrigin(1, 0.5).refreshBody(),
        down: scene.physics.add.staticImage(gateX.right, gateY.down, 'gate').setOrigin(1, 0.5).refreshBody(),
        bottom: scene.physics.add.staticImage(gateX.right, centerY, 'goal').setOrigin(1, 0.5).refreshBody()
      }
    };
  }

  getDoorChildren() {
    return [this.gate.left.up, this.gate.left.down, this.gate.right.up, this.gate.right.down];
  }

  getGoalChildren() {
    return {left: this.gate.left.bottom, right: this.gate.right.bottom};
  }
}
