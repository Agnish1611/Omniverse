import Phaser from 'phaser';

interface Message {
    user: string,
    text: string
}

export default class Game extends Phaser.Scene {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private adam!: Phaser.Physics.Arcade.Sprite;
    private socket!: WebSocket;
    private adamLabel!: Phaser.GameObjects.Text;
    private players: { [id: string]: { sprite: Phaser.Physics.Arcade.Sprite; label: Phaser.GameObjects.Text } } = {};
    private isJoined: boolean
    public messages: Message[]
    private updateMessages: (message: Message) => void;
    private setCurrentUser: (user: any) => void;
    private setSocket: (socket: WebSocket) => void;

    constructor(updateMessages: (message: Message) => void, setCurrentUser: (user: any) => void, setSocket: (socket: WebSocket) => void) {
        super('game');
        this.isJoined = false;
        this.updateMessages = updateMessages;
        this.setCurrentUser = setCurrentUser;
        this.setSocket = setSocket;
        this.messages = [{user: '', text: ''}]
    }

    preload() {
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    create() {
        const map = this.make.tilemap({ key: 'office' });

        const tileset = map.addTilesetImage('FloorAndGround', 'tiles');
        const basement = map.addTilesetImage('Basement', 'basement-objects');
        const generic = map.addTilesetImage('Generic', 'generic-objects');
        const office = map.addTilesetImage('Modern_Office_Black_Shadow', 'office-objects');

        map.createLayer('Ground', [tileset, basement, office]);
        const tiles_layer_3 = map.createLayer('Tile Layer 3', [basement, generic, tileset, office]);
        const tiles_layer_4 = map.createLayer('Tile Layer 4', [basement, generic, tileset, office]);
        const wallslayer = map.createLayer('Walls', [tileset, basement, generic, office]);

        wallslayer.setCollisionByProperty({ collision: true });
        tiles_layer_3.setCollisionByProperty({ collision: true });
        tiles_layer_4.setCollisionByProperty({ collision: true });

        this.adam = this.physics.add.sprite(200, 200, 'adam', 'Adam_idle_anim_1.png');
        this.createAnimations();
        this.adam.anims.play('adam-idle-down');
        this.physics.add.collider(this.adam, wallslayer);
        this.cameras.main.startFollow(this.adam, true);

        this.adamLabel = this.add.text(this.adam.x, this.adam.y - 30, 'Me', {
            fontSize: '14px',
            color: '#000000'
        }).setOrigin(0.5, 1).setDepth(999);

        // Connect to WebSocket server
        this.serverSetup();
        this.connectToServer();
    }

    createAnimations() {
        this.anims.create({ key: 'adam-idle-right', frames: this.anims.generateFrameNames('adam', { start: 1, end: 6, prefix: 'Adam_idle_anim_', suffix: '.png' }), repeat: -1, frameRate: 10 });
        this.anims.create({ key: 'adam-idle-up', frames: this.anims.generateFrameNames('adam', { start: 7, end: 12, prefix: 'Adam_idle_anim_', suffix: '.png' }), repeat: -1, frameRate: 10 });
        this.anims.create({ key: 'adam-idle-left', frames: this.anims.generateFrameNames('adam', { start: 13, end: 18, prefix: 'Adam_idle_anim_', suffix: '.png' }), repeat: -1, frameRate: 10 });
        this.anims.create({ key: 'adam-idle-down', frames: this.anims.generateFrameNames('adam', { start: 19, end: 24, prefix: 'Adam_idle_anim_', suffix: '.png' }), repeat: -1, frameRate: 10 });
        this.anims.create({ key: 'adam-run-right', frames: this.anims.generateFrameNames('adam', { start: 1, end: 6, prefix: 'Adam_run_', suffix: '.png' }), repeat: -1, frameRate: 10 });
        this.anims.create({ key: 'adam-run-up', frames: this.anims.generateFrameNames('adam', { start: 7, end: 12, prefix: 'Adam_run_', suffix: '.png' }), repeat: -1, frameRate: 10 });
        this.anims.create({ key: 'adam-run-left', frames: this.anims.generateFrameNames('adam', { start: 13, end: 18, prefix: 'Adam_run_', suffix: '.png' }), repeat: -1, frameRate: 10 });
        this.anims.create({ key: 'adam-run-down', frames: this.anims.generateFrameNames('adam', { start: 19, end: 24, prefix: 'Adam_run_', suffix: '.png' }), repeat: -1, frameRate: 10 });
    }

    serverSetup() {
        this.socket = new WebSocket('ws://localhost:3001');
        this.setSocket(this.socket);
    }

    connectToServer() {

        this.socket.onopen = () => {
            this.socket.send(JSON.stringify({
                type: 'join',
                payload: { spaceId: 'office' }
            }));
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'space-joined':
                    this.handleSpaceJoined(message.payload);
                    break;
                case 'user-joined':
                    this.addOtherPlayer(message.payload.userId, message.payload.x, message.payload.y);
                    break;
                case 'move':
                    this.moveOtherPlayer(message.payload.userId, message.payload.x, message.payload.y, message.payload.direction);
                    break;
                case 'user-left':
                    this.removePlayer(message.payload.userId);
                    break;
                case 'user-idle':
                    this.idleOtherPlayer(message.payload.userId, message.payload.x, message.payload.y, message.payload.direction);
                    break;
                case 'receive-message':
                    this.receiveMessage(message.payload.id, message.payload.text);
                    break;
            }
        };
    }

    handleSpaceJoined(payload: any) {
        this.adam.setPosition(payload.spawn.x, payload.spawn.y);

        this.adamLabel.setPosition(payload.spawn.x, payload.spawn.y - 30);

        payload.users.forEach((user: any) => {
            this.addOtherPlayer(user.id, user.x, user.y);
        });

        this.isJoined = true;

        const currentUser = payload.currentUser;
        this.setCurrentUser(currentUser);

        this.sendMessage('has joined the room', currentUser);
    }

    addOtherPlayer(id: string, x: number, y: number) {
        const player = this.physics.add.sprite(x, y, 'adam', 'Adam_idle_anim_1.png');
        player.play('adam-idle-down');

        const playerLabel = this.add.text(x, y - 20, id, { fontSize: '14px', color: '#000000' });
        playerLabel.setOrigin(0.5, 1).setDepth(999);

        this.players[id] = { sprite: player, label: playerLabel };
    }

    moveOtherPlayer(id: string, x: number, y: number, direction: string) {
        const player = this.players[id];
        if (player) {
            const { sprite, label } = player;
            sprite.setPosition(x, y);
            sprite.play(`adam-run-${direction}`, true);
        }
    }

    idleOtherPlayer(id: string, x: number, y: number, direction: string) {
        const player = this.players[id];
        if (player) {
            const { sprite, label } = player;
            sprite.setPosition(x, y);
            sprite.play(`adam-idle-${direction}`, true);
        }
    }

    removePlayer(id: string) {
        const player = this.players[id];
        if (player) {
            player.sprite.destroy();
            player.label.destroy();
            delete this.players[id];
        }
    }

    sendMovement(x: number, y: number, direction: string) {
        this.socket.send(JSON.stringify({
            type: 'move',
            payload: { x, y, direction }
        }));
    }

    sendIdle(x: number, y: number, direction: string) {
        this.socket.send(JSON.stringify({
            type: 'idle',
            payload: { x, y, direction }
        }));
    }

    sendMessage(text: string, id:string) {
        this.socket.send(JSON.stringify({
            type: 'chat-message',
            payload: {
                sender: id,
                text
            }
        }));
    }

    receiveMessage(id: string, text: string) {
        if (this.messages.length === 1) this.messages[0] = {user: id, text: text};
        else this.messages.push({user: id, text: text});
        console.log(this.messages);

        this.updateMessages({user: id, text: text});
    }

    update(t: number, dt: number) {
        if (!this.cursors || !this.adam) {
            return;
        }

        const speed = 200;
        let moved = false;
        let direction = '';

        if (this.cursors.left?.isDown) {
            this.adam.setVelocity(-speed, 0);
            this.adam.play('adam-run-left', true);
            direction = 'left';
            moved = true;
        } else if (this.cursors.right?.isDown) {
            this.adam.setVelocity(speed, 0);
            this.adam.play('adam-run-right', true);
            direction = 'right';
            moved = true;
        } else if (this.cursors.up?.isDown) {
            this.adam.setVelocity(0, -speed);
            this.adam.play('adam-run-up', true);
            direction = 'up';
            moved = true;
        } else if (this.cursors.down?.isDown) {
            this.adam.setVelocity(0, speed);
            this.adam.play('adam-run-down', true);
            direction = 'down';
            moved = true;
        } else {
            const currentAnim = this.adam.anims.currentAnim?.key.split('-');
            if (currentAnim) {
                currentAnim[1] = 'idle';
                this.adam.play(currentAnim.join('-'), true);
                if (this.isJoined) this.sendIdle(this.adam.x, this.adam.y, currentAnim[2]);
            }
            this.adam.setVelocity(0, 0);
        }

        if (moved) {
            this.sendMovement(this.adam.x, this.adam.y, direction);
        }

        this.adamLabel.setPosition(this.adam.x, this.adam.y - 30);

        Object.values(this.players).forEach(({ sprite, label }) => {
            label.setPosition(sprite.x, sprite.y - 20); // Keep the label above the sprite
        });
    }
}
