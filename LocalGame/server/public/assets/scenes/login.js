class LoginPage extends Phaser.Scene {
  constructor() {
    super('login');
  }

  create() {
    this.add.text(100, 100, "Login Page Test");
    this.scene.start('playGame');
  }
}
