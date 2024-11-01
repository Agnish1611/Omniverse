import Phaser from "phaser";

export default class Preloader extends Phaser.Scene {
    constructor() {
        super('preloader')
    }

    preload() {
        this.load.image('tiles', 'assets/map/FloorAndGround.png');
        this.load.tilemapTiledJSON('office', 'assets/map/office-01.json');

        this.load.atlas('adam', 'assets/character/adam.png', 'assets/character/adam.json');
    }

    create() {
        this.scene.start('game');
    }
}