export default class LoginPage extends Phaser.Scene {
  constructor() {
    super('login');
  }

  preload() {
    this.load.image('btn', 'assets/image/button.png');
    this.load.image('char', 'assets/image/char.png');
    this.load.bitmapFont('bitter_bmf', 'assets/bitmapFont/bitter.png', 'assets/bitmapFont/bitter.xml');
  }

  create() {
    this.titleText = this.add.bitmapText(20, 20, 'bitter_bmf',
      'Simple\nFootball', 42, 1).setTintFill(0x1c3d50);

    this.askText = this.add.bitmapText(600, 125, 'bitter_bmf',
      'Please Enter Your Nickname', 45).setOrigin(0.5).setTintFill(0x1c3d50);

    this.nickname = ['_', '_', '_', '_', '_'];
    this.nameText = this.add.bitmapText(600, 225, 'bitter_bmf',
      this.nickname.join('  '), 50).setOrigin(0.5).setTintFill(0xffffff);

    this.charBtn = this.add.image(200, 350, 'char').setVisible(false);
    this.charText = [[],[],[]];
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 9; j++) {
        var charX = 200 + 75 * j;
        var charY = 350 + 75 * i;
        var charCode = 65 + i * 9 + j;
        this.charText[i][j] = this.add.bitmapText(charX, charY, 'bitter_bmf',
          String.fromCharCode(charCode), 45).setOrigin(0.5)
          .setTintFill(0xffffff).setInteractive();
      }
    }
    this.charText[2][8].setText('-');

    this.charText.forEach((line, i) => {
      line.forEach((char, i) => {

        char.on('pointerover', () => {
          this.charBtn.setPosition(char.x, char.y - 5).setVisible(true);
        }, this);

        char.on('pointerout', () => {
          this.charBtn.setVisible(false);
        }, this);

        char.on('pointerup', () => {
          for (var i = 0; i < this.nickname.length; i++) {
            if (this.nickname[i] === '_') {
              this.nickname[i] = char.text;
              this.nameText.setText(this.nickname.join('  '));
              break;
            }
          }
        }, this);

      });
    });

    this.bg_delete = this.add.image(950, 400, 'btn').setOrigin(0.5);
    this.deleteBtn = this.add.text(950, 400, 'Delete', {fontSize: '40px'})
      .setOrigin(0.5).setInteractive();
    this.deleteBtn.on('pointerdown', () => {
      this.bg_delete.setTint(0x3760d9);
    }, this);
    this.deleteBtn.on('pointerup', () => {
      for (var i = 4; i >= 0; i--) {
        if (this.nickname[i] !== '_') {
          this.nickname[i] = '_';
          this.nameText.setText(this.nickname.join('  '));
          break;
        }
      }
      this.bg_delete.clearTint();
    }, this);

    this.bg_confirm = this.add.image(950, 475, 'btn').setOrigin(0.5);
    this.confirmBtn = this.add.text(950, 475, 'Confirm', {fontSize: '40px'})
      .setOrigin(0.5).setInteractive();
    this.confirmBtn.on('pointerdown', () => {
      this.bg_confirm.setTint(0x3760d9);
    }, this);
    this.confirmBtn.on('pointerup', () => {
      this.nickname.forEach((char, i) => {
        if (char === '_') {
          this.nickname[i] = '';
        }
      });
      if (this.nickname.join('') === '') {
        this.scene.start('playGame', {userName: '?????'});
      } else {
        this.scene.start('playGame', {userName: this.nickname.join('')});
      }
      this.bg_confirm.clearTint();
    }, this);

  }
}
