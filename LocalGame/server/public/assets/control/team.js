class PlayerTeam extends Phaser.GameObjects.Group {
  constructor(scene, playground, num) {
    super(scene, { max: 2 });

    var stepX = stepPosition(playground.position, num);
    var stepY = Math.floor(Math.random() * 100 * 0.15 ) / 100 + 0.25;

    this.add(new SoccerPlayer(scene,
      playground.x + playground.width * stepX,
      playground.y + playground.height * stepY,
      playground));
    this.add(new SoccerPlayer(scene,
      playground.x + playground.width * stepX,
      playground.y + playground.height * (1 - stepY),
      playground));
  }
}

function stepPosition(position, num) {
  var stepX
  switch (num) {
  case 0:
    stepX = position.a;
    break;
  case 1:
    stepX = position.b;
    break;
  case 2:
    stepX = position.c;
    break;
  case 3:
    stepX = position.d;
    break;
  }
  return stepX;
}
