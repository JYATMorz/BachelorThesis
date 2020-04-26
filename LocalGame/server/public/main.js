import LoginPage from './assets/scenes/login.js';
import PlayGame from './assets/scenes/play.js';

window.addEventListener('load', function() {

	var config = {
		type: Phaser.AUTO,
		width: 1200,
		height: 600,
		backgroundColor: 0xc4ba77,
		physics: {
			default: 'arcade',
			arcade: {
				gravity: {},
				debug: false
			}
		},
		fps: {
			min: 25,
	    target: 25,
	    forceSetTimeOut: true
		},
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH
		},
		scene: [LoginPage, PlayGame]
	};

	var game = new Phaser.Game(config);

});
