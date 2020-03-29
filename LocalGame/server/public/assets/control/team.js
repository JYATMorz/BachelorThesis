class PlayerTeam extends Phaser.GameObjects.Group {
  constructor(scene, playground, num) {
    super(scene, { max: 2 });

    var stepX = this.stepPosition(playground.position, num);
    var stepY = Math.floor(Math.random() * 100 * 0.15 ) / 100 + 0.25;

    this.arrow = scene.add.image(playground.x, playground.y, 'arrow').setOrigin(0, 0.5).setVisible(false);
    this.arrow.setInteractive();

    this.isSelectedTeam = false;

    this.playerUp = new SoccerPlayer(scene,
      playground.x + playground.width * stepX,
      playground.y + playground.height * stepY,
      playground);
    this.playerDown = new SoccerPlayer(scene,
      playground.x + playground.width * stepX,
      playground.y + playground.height * (1 - stepY),
      playground);

    this.selectPlayer(this.playerUp, scene);
    this.selectPlayer(this.playerDown, scene);
    this.add(this.playerUp);
    this.add(this.playerDown);
    this.updateNameText('Team' + (num + 1).toString());
  }

  selectPlayer(player, scene) {
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
      }
    }, this);
  }

  adjustForce(player, scene, arrow) {
    var centerX = player.x + arrow.width;
    var centerY = player.y;

    arrow.setPosition(player.x, player.y);

    arrow.on('pointerdown', function(pointer) {
      scene.input.mouse.requestPointerLock();
    });

    scene.input.on('pointermove', function(pointer) {
      if (scene.input.mouse.locked) {
        centerX += pointer.movementX;
        centerY += pointer.movementY;
        arrow.setRotation(Phaser.Math.Angle.Between(player.x, player.y, centerX, centerY));

        var distance = Phaser.Math.Distance.Between(player.x, player.y, centerX, centerY) / 100;
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
      scene.input.mouse.releasePointerLock();
      centerX = player.x + arrow.width;
      centerY = player.y;
    });

    arrow.setVisible(true);
  }

  stepPosition(position, num) {
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

  updateNameText(nickname) {
    this.playerUp.name.setText(nickname + ' 1');
    this.playerDown.name.setText(nickname + ' 2');
  }

  isTheSelectedTeam() {
    this.isSelectedTeam = true;
  }

  shoot() {
    this.arrow.setVisible(false);
    this.getChildren().forEach((player, i) => {
      if (player.isSelectedPlayer) {
        player.body.setVelocity(1000, 200);

      }
    });
    this.isSelectedTeam = false;
  }

}
