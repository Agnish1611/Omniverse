import Phaser from 'phaser';

export default class Background extends Phaser.Scene {
    private backdrop!: Phaser.GameObjects.Image;
    private sunMoon!: Phaser.GameObjects.Image;
    private clouds: Phaser.GameObjects.Sprite[] = [];

    constructor() {
        super({ key: 'background', active: true });
    }

    create() {
        console.log('Background scene create() called');
        
        // Ensure this scene renders behind the game scene
        this.scene.sendToBack();
        
        // Set up the background layers with proper depth
        this.setupBackground();
        this.setupSunMoon();
        this.setupClouds();
        this.setupDayNightCycle();

        // Listen for game events that might affect the background
        this.setupEventListeners();
        
        console.log('Background scene fully created');
    }

    private setupBackground() {
        console.log('Setting up background...');
        
        // Create the backdrop
        this.backdrop = this.add.image(0, 0, 'backdrop-day')
            .setOrigin(0, 0)
            .setDepth(0)
            .setScrollFactor(0); // Keep background fixed while camera moves

        console.log('Backdrop created:', this.backdrop);

        // Scale to cover the entire screen
        const scaleX = this.cameras.main.width / this.backdrop.width;
        const scaleY = this.cameras.main.height / this.backdrop.height;
        const scale = Math.max(scaleX, scaleY);
        this.backdrop.setScale(scale);
        
        console.log('Background setup complete, scale:', scale);
    }

    private setupSunMoon() {
        // Create sun/moon sprite
        this.sunMoon = this.add.image(
            this.cameras.main.width * 0.8, 
            this.cameras.main.height * 0.2, 
            'sun-moon'
        )
            .setDepth(10)
            .setScrollFactor(0)
            .setScale(1.5) // Increased from 0.8 to 1.5
            .setAlpha(0.9);

        // Gentle floating animation for sun/moon
        this.tweens.add({
            targets: this.sunMoon,
            y: this.sunMoon.y - 20,
            duration: 4000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    private setupClouds() {
        // Create initial clouds
        this.spawnCloud();
        this.time.delayedCall(2000, () => this.spawnCloud());
        this.time.delayedCall(4000, () => this.spawnCloud());
        
        // Set up infinite cloud spawning
        this.time.addEvent({
            delay: Phaser.Math.Between(8000, 15000), // Spawn new cloud every 8-15 seconds
            callback: this.spawnCloud,
            callbackScope: this,
            loop: true
        });
    }

    private spawnCloud() {
        // Limit the number of clouds to prevent memory issues
        if (this.clouds.length >= 8) {
            return; // Don't spawn more clouds if we already have enough
        }
        
        // Always use day clouds since we're keeping it as day only
        const cloudTexture = 'cloud-day';
        
        // Spawn cloud off-screen to the left
        const cloud = this.add.sprite(
            -300, 
            Phaser.Math.Between(20, this.cameras.main.height * 0.5),
            cloudTexture
        )
            .setDepth(5)
            .setScrollFactor(0)
            .setScale(Phaser.Math.FloatBetween(0.8, 2.2)) // Increased from (0.4, 1.4) to (0.8, 2.2)
            .setAlpha(Phaser.Math.FloatBetween(0.4, 0.8))
            .setFlipX(Phaser.Math.Between(0, 1) === 1); // Randomly flip for variety

        // Add to clouds array
        this.clouds.push(cloud);

        // Create cloud movement animation - slower and more varied
        const moveSpeed = Phaser.Math.Between(30000, 60000); // Even slower for more peaceful feel
        
        this.tweens.add({
            targets: cloud,
            x: this.cameras.main.width + 300,
            duration: moveSpeed,
            ease: 'Linear',
            onComplete: () => {
                // Remove cloud when it goes off-screen
                const index = this.clouds.indexOf(cloud);
                if (index > -1) {
                    this.clouds.splice(index, 1);
                }
                cloud.destroy();
            }
        });

        // Add subtle vertical movement
        this.tweens.add({
            targets: cloud,
            y: cloud.y + Phaser.Math.Between(-40, 40),
            duration: Phaser.Math.Between(10000, 20000),
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Add gentle scale animation
        this.tweens.add({
            targets: cloud,
            scaleX: cloud.scaleX * Phaser.Math.FloatBetween(0.9, 1.1),
            scaleY: cloud.scaleY * Phaser.Math.FloatBetween(0.9, 1.1),
            duration: Phaser.Math.Between(8000, 16000),
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Schedule next cloud spawn with random delay
        this.time.delayedCall(Phaser.Math.Between(5000, 12000), () => {
            if (this.clouds.length < 6) { // Limit max clouds
                this.spawnCloud();
            }
        });
    }

    private setupDayNightCycle() {
        // Keep it as day only - no automatic cycling
        // No need to track day/night state anymore
    }

    private setupEventListeners() {
        // Keep empty since we removed day/night functionality
    }

    // Public method to get current time of day (always day now)
    public getTimeOfDay(): 'day' | 'night' {
        return 'day';
    }
}
