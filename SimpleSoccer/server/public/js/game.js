import LoginPage from './scenes/login.js';
import PlayGame from './scenes/play.js';

window.addEventListener('load', function() {

	const config = {
		type: Phaser.AUTO,
		width: 1200,
		height: 600,
		backgroundColor: 0x91e389,
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

	const game = new Phaser.Game(config);

});
