import Phaser from "phaser";

export default class Preloader extends Phaser.Scene {
    constructor() {
        super('preloader')
    }

    preload() {
        // Add error handling for asset loading
        this.load.on('filecomplete', (key: string) => {
            console.log('Asset loaded:', key);
        });
        
        this.load.on('loaderror', (file: any) => {
            console.error('Asset failed to load:', file.key, file.url);
        });

        // Map and tileset assets
        this.load.image('tiles', 'assets/map/FloorAndGround.png');
        this.load.image('basement-objects', 'assets/tileset/Basement.png');
        this.load.image('generic-objects', 'assets/tileset/Generic.png');
        this.load.image('office-objects', 'assets/tileset/Modern_Office_Black_Shadow.png');

        this.load.tilemapTiledJSON('office', 'assets/map/office-01.json');

        // Character assets
        this.load.atlas('adam', 'assets/character/adam.png', 'assets/character/adam.json');
        this.load.atlas('ash', 'assets/character/ash.png', 'assets/character/ash.json');
        this.load.atlas('lucy', 'assets/character/lucy.png', 'assets/character/lucy.json');
        this.load.atlas('nancy', 'assets/character/nancy.png', 'assets/character/nancy.json');

        // Background assets
        this.load.image('backdrop-day', 'assets/background/backdrop_day.png');
        this.load.image('backdrop-night', 'assets/background/backdrop_night.png');
        this.load.image('sun-moon', 'assets/background/sun_moon.png');
        
        // Animated cloud assets
        this.load.atlas('cloud-day', 'assets/background/cloud_day.png', 'assets/background/cloud_day.json');
        this.load.atlas('cloud-night', 'assets/background/cloud_night.png', 'assets/background/cloud_night.json');
    }

    create() {
        console.log('Preloader create() - launching scenes...');
        
        // Log all available textures to verify character assets are loaded
        console.log('Available textures:', this.textures.getTextureKeys());
        
        // Launch both background and game scenes in parallel
        this.scene.launch('background');
        console.log('Background scene launched');
        
        this.scene.launch('game');
        console.log('Game scene launched');
        
        // Stop the preloader scene
        this.scene.stop();
    }
}