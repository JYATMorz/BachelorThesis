export default class PlayArea{

  constructor(scene, gameArea) {
    var centerX = gameArea.x + gameArea.width / 2;
    var centerY = gameArea.y + gameArea.height / 2;
    var gateX = {
      left: gameArea.x,
      right: gameArea.x + gameArea.width
    }
    var gateY = {
      up: gameArea.y + gameArea.height * 0.375,
      down: gameArea.y + gameArea.height * 0.625
    }

    this.background = scene.add.image(centerX, centerY, 'playground');
    this.goalPost = {
      left_up: scene.add.image(gateX.left, gateY.up, 'goalpost')
        .setOrigin(0, 0.5),
      left_down: scene.add.image(gateX.left, gateY.down, 'goalpost')
        .setOrigin(0, 0.5),
      right_up: scene.add.image(gateX.right, gateY.up, 'goalpost')
        .setOrigin(1, 0.5),
      right_down: scene.add.image(gateX.right, gateY.down, 'goalpost')
        .setOrigin(1, 0.5)
    }
    this.goalNet = {
      left: scene.add.image(gateX.left, centerY, 'goalnet')
        .setOrigin(0, 0.5),
      right: scene.add.image(gateX.right, centerY, 'goalnet')
        .setOrigin(1, 0.5)
    }
  }

  getGoalPost() {
    return [this.goalPost.left_up, this.goalPost.left_down, this.goalPost.right_up, this.goalPost.right_down];
  }

}
