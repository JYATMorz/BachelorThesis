class PlayerTeam {

  constructor(scene, playground, num) {
    var teamConfig = this.stepPosition(playground, num);
    var stepX = teamConfig.stepX;
    var stepY = Math.floor(Math.random() * 100 * 0.15 ) / 100 + 0.25;

    this.arrow = scene.add.image(playground.x, playground.y, 'arrow').setOrigin(0, 0.5).setVisible(false);
    this.arrow.setInteractive();

    this.teamNum = num;
    this.isSelectedTeam = false;
    this.userSocketID = null;

    this.playerUp = new SoccerPlayer(scene,
      playground.x + playground.width * stepX,
      playground.y + playground.height * stepY,
      playground);
    this.playerUp.setTintFill(teamConfig.tint);
    this.playerDown = new SoccerPlayer(scene,
      playground.x + playground.width * stepX,
      playground.y + playground.height * (1 - stepY),
      playground);
    this.playerDown.setTintFill(teamConfig.tint);

    this.selectPlayer(this.playerUp, scene, num % 2);
    this.selectPlayer(this.playerDown, scene, num % 2);
    this.updateNameText('Team' + (num + 1).toString());
  }

  getChildren() {
    return [this.playerUp, this.playerDown];
  }

  selectPlayer(player, scene, rotate) {
    player.on('pointerup',  function() {
      if (this.isSelectedTeam) {
        if (player === this.playerUp) {
          this.playerUp.isSelectedPlayer = true;
          this.playerDown.isSelectedPlayer = false;
        } else if (player === this.playerDown) {
          this.playerDown.isSelectedPlayer = true;
          this.playerUp.isSelectedPlayer = false;
        } else {
          console.log('Error at team.js:32');
        }
        this.adjustForce(player, scene, this.arrow);
        this.arrow.setScale(1).setRotation(- Math.PI * rotate);
      }
    }, this);
  }

  adjustForce(player, scene, arrow) {
    var adjusting = false;

    arrow.setPosition(player.x, player.y);

    arrow.on('pointerdown', function(pointer) {
      adjusting = true;
    });

    scene.input.on('pointermove', function(pointer) {
      if (scene.input.activePointer.isDown && adjusting) {
        arrow.setRotation(Phaser.Math.Angle.Between(
          player.x, player.y, scene.input.activePointer.x, scene.input.activePointer.y));

        var distance = Phaser.Math.Distance.Between(
          player.x, player.y, scene.input.activePointer.x, scene.input.activePointer.y) / 100;
        if (distance < 0.5) {
          arrow.setScale(0.5, 1);
        } else if (distance > 2) {
          arrow.setScale(2, 1);
        } else {
          arrow.setScale(distance, 1);
        }
      }
    });

    scene.input.on('pointerup', function(pointer) {
      adjusting = false;
    });

    arrow.setVisible(true);
  }

  stepPosition(playground, num) {
    var differTeam = {};
    switch (num) {
    case 0:
      differTeam.stepX = playground.position.a;
      differTeam.tint = playground.tintColor.blue;
      break;
    case 1:
      differTeam.stepX = playground.position.d;
      differTeam.tint = playground.tintColor.red;
      break;
    case 2:
      differTeam.stepX = playground.position.b;
      differTeam.tint = playground.tintColor.blue;
      break;
    case 3:
      differTeam.stepX = playground.position.c;
      differTeam.tint = playground.tintColor.red;
      break;
    }
    return differTeam;
  }

  updateNameText(nickname) {
    this.playerUp.name.setText(nickname + ' 1');
    this.playerDown.name.setText(nickname + ' 2');
  }

  shoot(socket) {
    this.arrow.setVisible(false);
    this.getChildren().forEach((player, i) => {
      if (player.isSelectedPlayer && socket.id === this.userSocketID) {
        var angle = this.arrow.rotation;
        var force = this.arrow.scaleX;
        var speed = new Phaser.Math.Vector2();
        speed.setToPolar(angle, force);

        socket.emit('toShootBall', {
          socketID: this.userSocketID,
          teamID: this.teamNum,
          playerID: i,
          speed: speed
        });
      }
    });
  }

  resetPosition(playground, stepY, num) {
    var stepX = this.stepPosition(playground, num).stepX;

    playerUp.setPosition(playground.x + playground.width * stepX,
      playground.y + playground.height * stepY);
    playerUp.updateNameLocation(playerUp.x, playerUp.y);

    playerDown.setPosition(layground.x + playground.width * stepX,
      playground.y + playground.height * (1 - stepY));
    playerDown.updateNameLocation(playerDown.x, playerDown.y);
  }
}
