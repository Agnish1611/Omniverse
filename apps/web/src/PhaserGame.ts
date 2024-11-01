import Phaser from 'phaser'

import Game from './scenes/Game';
import Preloader from './scenes/Preloader';

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: window.innerWidth,
	height: window.innerHeight,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 },
		},
	},
	scene: [Preloader, Game],
    scale: {
        zoom: 1
    }
}

export default new Phaser.Game(config)