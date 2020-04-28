class GoalGate {
  constructor(scene, gameArea) {
    var centerY = gameArea.y + gameArea.height / 2;
    var gateX = {
      left: gameArea.x,
      right: gameArea.x + gameArea.width
    };
    var gateY = {
      up: gameArea.y + gameArea.height * 0.375,
      down: gameArea.y + gameArea.height * 0.625
    };

    this.goalPost = {
      left_up: scene.physics.add.staticImage(gateX.left, gateY.up, 'goalpost')
        .setOrigin(0, 0.5).refreshBody(),
      left_down: scene.physics.add.staticImage(gateX.left, gateY.down, 'goalpost')
        .setOrigin(0, 0.5).refreshBody(),
      right_up: scene.physics.add.staticImage(gateX.right, gateY.up, 'goalpost')
        .setOrigin(1, 0.5).refreshBody(),
      right_down: scene.physics.add.staticImage(gateX.right, gateY.down, 'goalpost')
        .setOrigin(1, 0.5).refreshBody()
    }
    this.goalNet = {
      left: scene.physics.add.staticImage(gateX.left, centerY, 'goalnet')
        .setOrigin(0, 0.5).refreshBody(),
      right: scene.physics.add.staticImage(gateX.right, centerY, 'goalnet')
        .setOrigin(1, 0.5).refreshBody()
    }
  }

  getGoalPost() {
    return [this.goalPost.left_up, this.goalPost.left_down, this.goalPost.right_up, this.goalPost.right_down];
  }

}
