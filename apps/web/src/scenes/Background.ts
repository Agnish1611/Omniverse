import Phaser from 'phaser'

export default class Background extends Phaser.Scene {
	constructor() {
		super('background')
	}

	preload() {
		
	}

	create() {
		const map = this.make.tilemap({ key: 'office' });
        const tileset = map.addTilesetImage('FloorAndGround', 'tiles');

        map.createLayer('Ground', tileset);
        const wallslayer = map.createLayer('Walls', tileset);

        wallslayer.setCollisionByProperty({ collision: true });

        const debugGraphics = this.add.graphics().setAlpha(0.7);
        wallslayer.renderDebug(debugGraphics, {
            tileColor: null,
            collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
            faceColor: new Phaser.Display.Color(40, 39, 37, 255)
        })
	}
}