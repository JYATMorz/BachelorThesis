class PlayerTeam {
  constructor(scene, gameArea, teamNum) {
    var stepValue = this.stepValue(gameArea, teamNum);

    this.teamNum = teamNum;
    this.isSelectedTeam = false;
    this.playerUp = new SoccerPlayer(scene,
      gameArea.x + gameArea.width * stepValue.stepX,
      gameArea.y + gameArea.height * stepValue.stepY,
      gameArea);
    this.playerDown = new SoccerPlayer(scene,
      gameArea.x + gameArea.width * stepValue.stepX,
      gameArea.y + gameArea.height * (1 - stepValue.stepY),
      gameArea);
  }

  getChildren() {
    return [this.playerUp, this.playerDown];
  }

  resetPosition(gameArea, teamNum) {
    var stepValue = this.stepValue(gameArea, teamNum);
    this.playerUp.setPosition(
      gameArea.x + gameArea.width * stepValue.stepX,
      gameArea.y + gameArea.height * stepValue.stepY);
    this.playerDown.setPosition(
      gameArea.x + gameArea.width * stepValue.stepX,
      gameArea.y + gameArea.height * (1 - stepValue.stepY));
  }

  stepValue(gameArea, teamNum) {
    var stepX, stepY;
    switch (teamNum) {
      case 0:
        stepX = gameArea.position.team0;
        stepY = gameArea.position.side;
        break;
      case 1:
        stepX = gameArea.position.team1;
        stepY = gameArea.position.side;
        break;
      case 2:
        stepX = gameArea.position.team2;
        stepY = gameArea.position.center;
        break;
      case 3:
        stepX = gameArea.position.team3;
        stepY = gameArea.position.center;
        break;
    }
    return {stepX: stepX, stepY: stepY};
  }

}
