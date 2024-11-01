import Phaser from 'phaser'

export default class Game extends Phaser.Scene {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private adam!: Phaser.Physics.Arcade.Sprite

	constructor() {
		super('game')
	}

	preload() {
		this.cursors = this.input.keyboard.createCursorKeys();
	}

	create() {
		const map = this.make.tilemap({ key: 'office' });
        const tileset = map.addTilesetImage('FloorAndGround', 'tiles');

        map.createLayer('Ground', tileset);
        const wallslayer = map.createLayer('Walls', tileset);

        wallslayer.setCollisionByProperty({ collision: true });

        this.adam = this.physics.add.sprite(200, 200, 'adam', 'Adam_idle_anim_1.png');

        this.anims.create({
            key: 'adam-idle-right',
            frames: this.anims.generateFrameNames('adam', { start: 1, end: 6, prefix: 'Adam_idle_anim_', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        });

        this.anims.create({
            key: 'adam-idle-up',
            frames: this.anims.generateFrameNames('adam', { start: 7, end: 12, prefix: 'Adam_idle_anim_', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        });

        this.anims.create({
            key: 'adam-idle-left',
            frames: this.anims.generateFrameNames('adam', { start: 13, end: 18, prefix: 'Adam_idle_anim_', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        });

        this.anims.create({
            key: 'adam-idle-down',
            frames: this.anims.generateFrameNames('adam', { start: 19, end: 24, prefix: 'Adam_idle_anim_', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        });

        this.anims.create({
            key: 'adam-run-right',
            frames: this.anims.generateFrameNames('adam', { start: 1, end: 6, prefix: 'Adam_run_', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        });

        this.anims.create({
            key: 'adam-run-up',
            frames: this.anims.generateFrameNames('adam', { start: 7, end: 12, prefix: 'Adam_run_', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        });

        this.anims.create({
            key: 'adam-run-left',
            frames: this.anims.generateFrameNames('adam', { start: 13, end: 18, prefix: 'Adam_run_', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        });

        this.anims.create({
            key: 'adam-run-down',
            frames: this.anims.generateFrameNames('adam', { start: 19, end: 24, prefix: 'Adam_run_', suffix: '.png'}),
            repeat: -1,
            frameRate: 10
        });

        this.adam.anims.play('adam-run-right');

        this.physics.add.collider(this.adam, wallslayer);

        this.cameras.main.startFollow(this.adam, true);

        // const debugGraphics = this.add.graphics().setAlpha(0.7);
        // wallslayer.renderDebug(debugGraphics, {
        //     tileColor: null,
        //     collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
        //     faceColor: new Phaser.Display.Color(40, 39, 37, 255)
        // })
	}

    update(t: number, dt: number) {
        if (!this.cursors || !this.adam) {
            return;
        }

        const speed = 200;

        if (this.cursors.left?.isDown) {
            this.adam.anims.play('adam-run-left', true);
            this.adam.setVelocity(-speed, 0);
        } else if (this.cursors.right?.isDown) {
            this.adam.anims.play('adam-run-right', true);
            this.adam.setVelocity(speed, 0);
        } else if (this.cursors.up?.isDown) {
            this.adam.anims.play('adam-run-up', true);
            this.adam.setVelocity(0, -speed);
        } else if (this.cursors.down?.isDown) {
            this.adam.anims.play('adam-run-down', true);
            this.adam.setVelocity(0, speed);
        } else {
            const parts = this.adam.anims.currentAnim.key.split('-');
            parts[1] = 'idle'
            this.adam.play(parts.join('-'), true);
            this.adam.setVelocity(0, 0);
        }
    }
}