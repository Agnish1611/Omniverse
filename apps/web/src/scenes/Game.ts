import Phaser from 'phaser';
import { Message } from '@/store/messages';

// Define WebSocket message types for better type safety
interface WebSocketPayload {
    spaceId?: string;
    userId?: string;
    userName?: string; // User's display name
    x?: number;
    y?: number;
    direction?: string;
    spawn?: { x: number; y: number };
    users?: Array<{ id: string; name: string; x: number; y: number; characterType?: string }>;
    currentUser?: string;
    id?: string;
    text?: string;
    sender?: string;
    characterType?: string; // Character sprite to use (adam, ash, lucy, nancy)
}

export default class Game extends Phaser.Scene {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private player!: Phaser.Physics.Arcade.Sprite; // Renamed from adam to player for clarity
    private socket!: WebSocket;
    private playerLabel!: Phaser.GameObjects.Text; // Renamed from adamLabel to playerLabel
    private players: { [id: string]: { sprite: Phaser.Physics.Arcade.Sprite; label: Phaser.GameObjects.Text; characterType: string } } = {};
    private joinedUsers: Set<string> = new Set(); // Track users who have already joined
    private isJoined: boolean = false;
    public messages: Message[] = [];
    private updateMessages: (user: string, text: string) => void;
    private setCurrentUser: (user: string) => void;
    private setSocket: (socket: WebSocket) => void;
    private playerName: string;
    private characterType: string; // The selected character type (adam, ash, lucy, nancy)

    constructor(
        updateMessages: (user: string, text: string) => void, 
        setCurrentUser: (user: string) => void, 
        setSocket: (socket: WebSocket) => void,
        playerName: string,
        characterType: string
    ) {
        super('game');
        this.updateMessages = updateMessages;
        this.setCurrentUser = setCurrentUser;
        this.setSocket = setSocket;
        this.playerName = playerName;
        this.characterType = characterType || 'adam'; // Default to adam if not specified
    }
    
    // Helper method to capitalize first letter for sprite key formatting
    capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    preload() {
        const keyboard = this.input.keyboard;
        if (keyboard) {
            this.cursors = keyboard.createCursorKeys();
        }
    }

    create() {
        // Make this scene's camera background transparent so the background scene shows through
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0)');
        console.log('Game scene camera set to transparent');
        console.log('Creating game with character:', this.characterType);
        
        // Log available textures at game creation time
        console.log('Available textures in Game scene:', this.textures.getTextureKeys());
        
        const map = this.make.tilemap({ key: 'office' });

        const tileset = map.addTilesetImage('FloorAndGround', 'tiles');
        const basement = map.addTilesetImage('Basement', 'basement-objects');
        const generic = map.addTilesetImage('Generic', 'generic-objects');
        const office = map.addTilesetImage('Modern_Office_Black_Shadow', 'office-objects');

        // Check if all tilesets loaded successfully
        if (!tileset || !basement || !generic || !office) {
            console.error('Failed to load one or more tilesets');
            return;
        }

        const tilesets = [tileset, basement, office];
        const allTilesets = [basement, generic, tileset, office];

        // Create layers with appropriate depth values
        const groundLayer = map.createLayer('Ground', tilesets);
        if (groundLayer) {
            groundLayer.setDepth(20);
        }
        
        const tiles_layer_3 = map.createLayer('Tile Layer 3', allTilesets);
        if (tiles_layer_3) {
            tiles_layer_3.setDepth(30);
        }
        
        const tiles_layer_4 = map.createLayer('Tile Layer 4', allTilesets);
        if (tiles_layer_4) {
            tiles_layer_4.setDepth(40);
        }
        
        const wallslayer = map.createLayer('Walls', allTilesets);
        if (wallslayer) {
            wallslayer.setDepth(50);
        }

        // Set collision properties with null checks
        if (wallslayer) {
            wallslayer.setCollisionByProperty({ collision: true });
        }
        if (tiles_layer_3) {
            tiles_layer_3.setCollisionByProperty({ collision: true });
        }
        if (tiles_layer_4) {
            tiles_layer_4.setCollisionByProperty({ collision: true });
        }

        // First create all animations
        this.createAnimations();
        
        // Verify character textures are loaded
        const validCharacters = ['adam', 'ash', 'lucy', 'nancy'];
        if (!validCharacters.includes(this.characterType)) {
            console.error(`Invalid character type: ${this.characterType}, defaulting to adam`);
            this.characterType = 'adam';
        }
        
        // Create player using the selected character
        const frameKey = `${this.capitalizeFirstLetter(this.characterType)}_idle_anim_19.png`;
        console.log(`Creating player with character: ${this.characterType}, frame: ${frameKey}`);
        
        // Check if texture exists
        if (!this.textures.exists(this.characterType)) {
            console.error(`Texture for character ${this.characterType} not found! Available textures:`, this.textures.getTextureKeys());
            console.error('This is a critical error. Trying to recover...');
            // Try to load the texture again (emergency recovery)
            this.characterType = 'adam'; // Fallback to adam
        }
        
        // Create the player sprite
        this.player = this.physics.add.sprite(200, 200, this.characterType);
        this.player.setDepth(100); // Set player depth higher than environment
        
        // Start with the default idle animation
        this.player.anims.play(`${this.characterType}-idle-down`);
        
        // Add collider only if wallslayer exists
        if (wallslayer) {
            this.physics.add.collider(this.player, wallslayer);
        }
        
        this.cameras.main.startFollow(this.player, true);

        this.playerLabel = this.add.text(this.player.x, this.player.y - 30, this.playerName, {
            fontSize: '14px',
            color: '#000000'
        }).setOrigin(0.5, 1).setDepth(150); // Higher than player

        // Connect to WebSocket server
        this.serverSetup();
        this.connectToServer();
    }

    createAnimations() {
        // Create animations for all character types
        const characters = ['adam', 'ash', 'lucy', 'nancy'];
        
        console.log('Creating animations for characters:', characters);
        console.log('Available textures:', this.textures.getTextureKeys());
        
        // First destroy any existing character animations to avoid duplicates
        characters.forEach(char => {
            const animationKeys = [
                `${char}-idle-right`, `${char}-idle-up`, `${char}-idle-left`, `${char}-idle-down`,
                `${char}-run-right`, `${char}-run-up`, `${char}-run-left`, `${char}-run-down`
            ];
            
            animationKeys.forEach(key => {
                if (this.anims.exists(key)) {
                    console.log(`Removing existing animation: ${key}`);
                    this.anims.remove(key);
                }
            });
        });
        
        characters.forEach(char => {
            if (!this.textures.exists(char)) {
                console.error(`Texture for ${char} does not exist. Cannot create animations!`);
                return;
            }
            
            try {
                const capitalChar = this.capitalizeFirstLetter(char);
                console.log(`Creating animations for ${char} (${capitalChar})`);
                
                // Check if we have frames
                const frames = this.textures.get(char).getFrameNames();
                console.log(`${char} has ${frames.length} frames. Sample:`, frames.slice(0, 5));
                
                // Idle animations
                this.anims.create({ key: `${char}-idle-right`, frames: this.anims.generateFrameNames(char, { start: 1, end: 6, prefix: `${capitalChar}_idle_anim_`, suffix: '.png' }), repeat: -1, frameRate: 10 });
                this.anims.create({ key: `${char}-idle-up`, frames: this.anims.generateFrameNames(char, { start: 7, end: 12, prefix: `${capitalChar}_idle_anim_`, suffix: '.png' }), repeat: -1, frameRate: 10 });
                this.anims.create({ key: `${char}-idle-left`, frames: this.anims.generateFrameNames(char, { start: 13, end: 18, prefix: `${capitalChar}_idle_anim_`, suffix: '.png' }), repeat: -1, frameRate: 10 });
                this.anims.create({ key: `${char}-idle-down`, frames: this.anims.generateFrameNames(char, { start: 19, end: 24, prefix: `${capitalChar}_idle_anim_`, suffix: '.png' }), repeat: -1, frameRate: 10 });
                
                // Run animations - Note: run animations don't have 'anim' in the prefix
                this.anims.create({ key: `${char}-run-right`, frames: this.anims.generateFrameNames(char, { start: 1, end: 6, prefix: `${capitalChar}_run_`, suffix: '.png' }), repeat: -1, frameRate: 10 });
                this.anims.create({ key: `${char}-run-up`, frames: this.anims.generateFrameNames(char, { start: 7, end: 12, prefix: `${capitalChar}_run_`, suffix: '.png' }), repeat: -1, frameRate: 10 });
                this.anims.create({ key: `${char}-run-left`, frames: this.anims.generateFrameNames(char, { start: 13, end: 18, prefix: `${capitalChar}_run_`, suffix: '.png' }), repeat: -1, frameRate: 10 });
                this.anims.create({ key: `${char}-run-down`, frames: this.anims.generateFrameNames(char, { start: 19, end: 24, prefix: `${capitalChar}_run_`, suffix: '.png' }), repeat: -1, frameRate: 10 });
                
                console.log(`Successfully created animations for ${char}`);
            } catch (error) {
                console.error(`Failed to create animations for ${char}:`, error);
            }
        });
        
        // Log which animations are now available
        const animsAvailable = characters.flatMap(char => [
            `${char}-idle-right`, `${char}-idle-up`, `${char}-idle-left`, `${char}-idle-down`,
            `${char}-run-right`, `${char}-run-up`, `${char}-run-left`, `${char}-run-down`
        ]).filter(key => this.anims.exists(key));
        
        console.log(`Available animations (${animsAvailable.length}):`, animsAvailable);
    }

    serverSetup() {
        this.socket = new WebSocket('ws://localhost:3001');
        this.setSocket(this.socket);
    }

    connectToServer() {
        this.socket.onopen = () => {
            console.log(`Connecting to server as ${this.playerName} with character: ${this.characterType}`);
            
            // First, send the user's name and character type
            this.socket.send(JSON.stringify({
                type: 'set-name',
                payload: { 
                    name: this.playerName,
                    characterType: this.characterType 
                }
            }));
            
            // Then join the space
            this.socket.send(JSON.stringify({
                type: 'join',
                payload: { 
                    spaceId: 'office',
                    characterType: this.characterType // Include character type in join message as well
                }
            }));
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log(`Received message of type: ${message.type}`, message);
                
                switch (message.type) {
                    case 'name-set':
                        // Confirmation of our name and character being set
                        console.log('Name set confirmed:', message.payload);
                        break;
                        
                    case 'space-joined':
                        this.handleSpaceJoined(message.payload);
                        break;
                        
                    case 'user-joined':
                        console.log('[USER JOINED] Message:', message.payload);
                        if (message.payload?.userId && 
                            typeof message.payload.x === 'number' && 
                            typeof message.payload.y === 'number') {
                            const userName = message.payload.userName || message.payload.userId;
                            const userId = message.payload.userId;
                            const characterType = message.payload.characterType || 'adam';
                            
                            console.log(`[USER JOINED] ${userName} (${userId}) with character: ${characterType}`);
                            
                            // Only add player and show message if they don't already exist
                            if (!this.players[userId]) {
                                console.log(`[USER JOINED] Creating new player for ${userName} with character ${characterType}`);
                                this.addOtherPlayer(userId, message.payload.x, message.payload.y, userName, characterType);
                            } else {
                                console.log(`[USER JOINED] Player ${userName} already exists, checking if character update needed`);
                                // Update the character type for existing players if it's different
                                if (this.players[userId].characterType !== characterType) {
                                    console.log(`[USER JOINED] Updating character for ${userName} from ${this.players[userId].characterType} to ${characterType}`);
                                    this.updatePlayerCharacter(userId, characterType);
                                }
                            }
                            
                            // Only show join message if we haven't shown it for this user before
                            if (!this.joinedUsers.has(userId)) {
                                console.log('Showing join message for:', userName);
                                this.joinedUsers.add(userId);
                                this.updateMessages(userName, 'has joined the room');
                            } else {
                                console.log('Join message already shown for:', userName);
                            }
                        }
                        break;
                    case 'move':
                        if (message.payload?.userId && 
                            typeof message.payload.x === 'number' && 
                            typeof message.payload.y === 'number' && 
                            message.payload.direction) {
                            
                            console.log(`Received move message for user ${message.payload.userId} with character: ${message.payload.characterType}`);
                            
                            // If player doesn't exist yet, create them
                            if (!this.players[message.payload.userId] && message.payload.userName) {
                                console.log(`Player ${message.payload.userId} doesn't exist yet, adding them`);
                                this.addOtherPlayer(
                                    message.payload.userId, 
                                    message.payload.x, 
                                    message.payload.y, 
                                    message.payload.userName, 
                                    message.payload.characterType || 'adam'
                                );
                            } 
                            // Update character type if provided and player exists
                            else if (message.payload.characterType && this.players[message.payload.userId]) {
                                console.log(`Player exists but needs character update: ${message.payload.userId}`);
                                if (this.players[message.payload.userId].characterType !== message.payload.characterType) {
                                    this.updatePlayerCharacter(message.payload.userId, message.payload.characterType);
                                }
                            }
                            
                            // Ensure character type is properly set before moving the player
                            if (message.payload.characterType && this.players[message.payload.userId]) {
                                // Set the character type directly on the player object
                                this.players[message.payload.userId].characterType = message.payload.characterType;
                                console.log(`Updated character type for ${message.payload.userId} to: ${message.payload.characterType}`);
                            }
                            
                            console.log(`Moving player ${message.payload.userId} with stored character: ${this.players[message.payload.userId]?.characterType}`);
                            this.moveOtherPlayer(message.payload.userId, message.payload.x, message.payload.y, message.payload.direction);
                        }
                        break;
                    case 'user-left':
                        if (message.payload?.userId) {
                            this.removePlayer(message.payload.userId);
                        }
                        break;
                    case 'user-idle':
                        if (message.payload?.userId && 
                            typeof message.payload.x === 'number' && 
                            typeof message.payload.y === 'number' && 
                            message.payload.direction) {
                            
                            console.log(`Received idle message for user ${message.payload.userId} with character: ${message.payload.characterType}`);
                            
                            // If player doesn't exist yet, create them
                            if (!this.players[message.payload.userId] && message.payload.userName) {
                                console.log(`Player ${message.payload.userId} doesn't exist yet, adding them`);
                                this.addOtherPlayer(
                                    message.payload.userId, 
                                    message.payload.x, 
                                    message.payload.y, 
                                    message.payload.userName, 
                                    message.payload.characterType || 'adam'
                                );
                            } 
                            // Update character type if provided and player exists
                            else if (message.payload.characterType && this.players[message.payload.userId]) {
                                console.log(`Player exists but needs character update: ${message.payload.userId}`);
                                if (this.players[message.payload.userId].characterType !== message.payload.characterType) {
                                    this.updatePlayerCharacter(message.payload.userId, message.payload.characterType);
                                }
                            }
                            
                            // Ensure character type is properly set before idling the player
                            if (message.payload.characterType && this.players[message.payload.userId]) {
                                // Set the character type directly on the player object
                                this.players[message.payload.userId].characterType = message.payload.characterType;
                                console.log(`Updated character type for ${message.payload.userId} to: ${message.payload.characterType}`);
                            }
                            
                            console.log(`Idling player ${message.payload.userId} with stored character: ${this.players[message.payload.userId]?.characterType}`);
                            this.idleOtherPlayer(message.payload.userId, message.payload.x, message.payload.y, message.payload.direction);
                        }
                        break;
                    case 'receive-message':
                        if (message.payload?.id && message.payload?.text) {
                            this.receiveMessage(message.payload.id, message.payload.text);
                        }
                        break;
                    default:
                        console.warn('Unknown message type:', message.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }

    handleSpaceJoined(payload: WebSocketPayload) {
        console.log('Space joined with payload:', payload);
        
        if (payload.spawn && typeof payload.spawn.x === 'number' && typeof payload.spawn.y === 'number') {
            this.player.setPosition(payload.spawn.x, payload.spawn.y);
            this.playerLabel.setPosition(payload.spawn.x, payload.spawn.y - 30);
        }

        if (payload.users && Array.isArray(payload.users)) {
            console.log('Existing users in space:', payload.users);
            payload.users.forEach((user) => {
                if (user.id && typeof user.x === 'number' && typeof user.y === 'number') {
                    console.log(`Adding existing player ${user.name || user.id} with character: ${user.characterType || 'adam'}`);
                    this.addOtherPlayer(user.id, user.x, user.y, user.name, user.characterType || 'adam');
                }
            });
        }

        this.isJoined = true;

        if (payload.currentUser && typeof payload.currentUser === 'string') {
            // Only update the user ID, don't override the name
            this.setCurrentUser(payload.currentUser);
            // Remove the duplicate join message - it should come from server broadcast
        }
    }

    addOtherPlayer(id: string, x: number, y: number, userName?: string, characterType: string = 'adam') {
        console.log(`[PLAYER CREATE] Adding player ${id} with character: ${characterType}`);
        
        try {
            // Make sure we're using a valid character type
            const validCharacters = ['adam', 'ash', 'lucy', 'nancy'];
            if (!validCharacters.includes(characterType)) {
                console.error(`Invalid character type: ${characterType}, defaulting to adam`);
                characterType = 'adam';
            }
            
            // Make sure texture exists
            if (!this.textures.exists(characterType)) {
                console.error(`Texture ${characterType} not found! Available textures:`, this.textures.getTextureKeys());
                console.error(`Falling back to adam for player ${id}`);
                characterType = 'adam';
            }
            
            // Add some debugging for texture frames
            if (this.textures.exists(characterType)) {
                const frames = this.textures.get(characterType).getFrameNames();
                console.log(`Texture ${characterType} has ${frames.length} frames:`, frames.slice(0, 5), '...');
            }
            
            // Make sure animations are created
            const animationKey = `${characterType}-idle-down`;
            if (!this.anims.exists(animationKey)) {
                console.log(`Animation ${animationKey} doesn't exist, recreating animations...`);
                this.createAnimations();
                
                if (!this.anims.exists(animationKey)) {
                    console.error(`Failed to create animation ${animationKey}, using adam instead`);
                    characterType = 'adam';
                }
            }
            
            // Create the player sprite
            console.log(`Creating sprite for player ${id} with character ${characterType}`);
            const player = this.physics.add.sprite(x, y, characterType);
            player.setDepth(100);
            
            // Play the idle animation
            const idleAnimKey = `${characterType}-idle-down`;
            console.log(`Playing animation ${idleAnimKey} for player ${id}`);
            player.play(idleAnimKey);

            // Create player label
            const displayName = userName || id;
            const playerLabel = this.add.text(x, y - 20, displayName, { 
                fontSize: '14px',
                color: '#000000',
                backgroundColor: 'rgba(255,255,255,0.5)',
                padding: { x: 3, y: 1 },
                shadow: { offsetX: 1, offsetY: 1, color: '#ffffff', blur: 1, fill: true }
            });
            playerLabel.setOrigin(0.5, 1).setDepth(999);

            // Store player in the players map
            this.players[id] = { 
                sprite: player, 
                label: playerLabel,
                characterType: characterType
            };
            
            console.log(`Player ${id} (${displayName}) successfully added with character: ${characterType}`);
            return true;
        } catch (error) {
            console.error(`Error adding player ${id} with character ${characterType}:`, error);
            return false;
        }
    }

    moveOtherPlayer(id: string, x: number, y: number, direction: string) {
        const player = this.players[id];
        if (!player) {
            console.warn(`Tried to move non-existent player: ${id}`);
            return;
        }

        // Destructure only after confirming player exists
        const { sprite, label } = player;
        const characterType = player.characterType || 'adam'; // Ensure we have a default
        
        // Set positions
        sprite.setPosition(x, y);
        label.setPosition(x, y - 20); // Update label position
        
            try {
                // Log for debugging
                console.log(`Moving player ${id} with character type: ${characterType}`);            // Make sure we're using a valid character type
            const validCharacters = ['adam', 'ash', 'lucy', 'nancy'];
            const safeCharType = validCharacters.includes(characterType) ? characterType : 'adam';
            
            // Always ensure the character type in the player object is valid
            player.characterType = safeCharType;
            
            // Create the animation key
            const animKey = `${safeCharType}-run-${direction}`;
            
            // Check if animation exists
            if (!this.anims.exists(animKey)) {
                console.warn(`Animation ${animKey} doesn't exist, recreating animations...`);
                this.createAnimations();
            }
            
            // Try to play the animation, with a fallback if it still doesn't exist
            if (this.anims.exists(animKey)) {
                sprite.play(animKey, true);
            } else {
                console.error(`Failed to create animation ${animKey}, using default`);
                sprite.play(`adam-run-${direction}`, true);
            }
        } catch (error) {
            console.error(`Failed to play animation for player ${id}:`, error);
            // Last resort fallback
            try {
                sprite.play(`adam-run-${direction}`, true);
            } catch (e) {
                console.error('Even fallback animation failed:', e);
            }
        }
    }

    idleOtherPlayer(id: string, x: number, y: number, direction: string) {
        const player = this.players[id];
        if (!player) {
            console.warn(`Tried to idle non-existent player: ${id}`);
            return;
        }

        // Destructure only after confirming player exists
        const { sprite, label } = player;
        const characterType = player.characterType || 'adam'; // Ensure we have a default
        
        // Set positions
        sprite.setPosition(x, y);
        label.setPosition(x, y - 20); // Update label position
        
            try {
                // Log for debugging
                console.log(`Idling player ${id} with character type: ${characterType}`);            // Make sure we're using a valid character type
            const validCharacters = ['adam', 'ash', 'lucy', 'nancy'];
            const safeCharType = validCharacters.includes(characterType) ? characterType : 'adam';
            
            // Always ensure the character type in the player object is valid
            player.characterType = safeCharType;
            
            // Create the animation key
            const animKey = `${safeCharType}-idle-${direction}`;
            
            // Check if animation exists
            if (!this.anims.exists(animKey)) {
                console.warn(`Animation ${animKey} doesn't exist, recreating animations...`);
                this.createAnimations();
            }
            
            // Try to play the animation, with a fallback if it still doesn't exist
            if (this.anims.exists(animKey)) {
                sprite.play(animKey, true);
            } else {
                console.error(`Failed to create animation ${animKey}, using default`);
                sprite.play(`adam-idle-${direction}`, true);
            }
        } catch (error) {
            console.error(`Failed to play idle animation for player ${id}:`, error);
            // Last resort fallback
            try {
                sprite.play(`adam-idle-${direction}`, true);
            } catch (e) {
                console.error('Even fallback animation failed:', e);
            }
        }
    }
    
    // This method updates a player's character type and recreates their sprite
    updatePlayerCharacter(id: string, characterType: string) {
        if (!this.players[id]) {
            console.warn(`Cannot update character for non-existent player: ${id}`);
            return;
        }
        
        console.log(`Updating character for player ${id} to ${characterType}`);
        
        // Make sure we're using a valid character type
        const validCharacters = ['adam', 'ash', 'lucy', 'nancy'];
        if (!validCharacters.includes(characterType)) {
            console.error(`Invalid character type: ${characterType}, defaulting to adam`);
            characterType = 'adam';
        }
        
        // Get current position and movement state
        const { sprite, label } = this.players[id];
        const x = sprite.x;
        const y = sprite.y;
        const userName = label.text;
        
        // Get current animation key to determine direction and state
        let direction = 'down';
        let state = 'idle';
        
        if (sprite.anims.currentAnim) {
            const animParts = sprite.anims.currentAnim.key.split('-');
            if (animParts.length === 3) {
                state = animParts[1]; // 'idle' or 'run'
                direction = animParts[2]; // 'up', 'down', 'left', 'right'
            }
        }
        
        // Destroy old sprite
        sprite.destroy();
        
        // Force regenerate animations to make sure they're all available
        this.createAnimations();
        
        // Create new sprite with updated character
        const newSprite = this.physics.add.sprite(x, y, characterType);
        newSprite.play(`${characterType}-${state}-${direction}`);
        newSprite.setDepth(100);
        
        // Update the player object
        this.players[id].sprite = newSprite;
        this.players[id].characterType = characterType;
        
        console.log(`Player ${id} (${userName}) character updated to ${characterType}, animation: ${characterType}-${state}-${direction}`);
    }

    removePlayer(id: string) {
        const player = this.players[id];
        if (player) {
            player.sprite.destroy();
            player.label.destroy();
            delete this.players[id];
            this.joinedUsers.delete(id); // Remove from joined users set
        }
    }

    sendMovement(x: number, y: number, direction: string) {
        this.socket.send(JSON.stringify({
            type: 'move',
            payload: { 
                x, 
                y, 
                direction,
                characterType: this.characterType // Include characterType in movement messages
            }
        }));
    }

    sendIdle(x: number, y: number, direction: string) {
        this.socket.send(JSON.stringify({
            type: 'idle',
            payload: { 
                x, 
                y, 
                direction,
                characterType: this.characterType // Include characterType in idle messages
            }
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
        console.log(`Received message from ${id}: ${text}`);
        // Only update messages if it's not from the current user (to prevent duplicates)
        if (id !== this.playerName) {
            this.updateMessages(id, text);
        }
    }

    override update(_time: number, _delta: number) {
        if (!this.cursors || !this.player) {
            return;
        }

        const speed = 200;
        let moved = false;
        let direction = '';

        if (this.cursors.left?.isDown) {
            this.player.setVelocity(-speed, 0);
            this.player.play(`${this.characterType}-run-left`, true);
            direction = 'left';
            moved = true;
        } else if (this.cursors.right?.isDown) {
            this.player.setVelocity(speed, 0);
            this.player.play(`${this.characterType}-run-right`, true);
            direction = 'right';
            moved = true;
        } else if (this.cursors.up?.isDown) {
            this.player.setVelocity(0, -speed);
            this.player.play(`${this.characterType}-run-up`, true);
            direction = 'up';
            moved = true;
        } else if (this.cursors.down?.isDown) {
            this.player.setVelocity(0, speed);
            this.player.play(`${this.characterType}-run-down`, true);
            direction = 'down';
            moved = true;
        } else {
            const currentAnim = this.player.anims.currentAnim?.key.split('-');
            if (currentAnim) {
                currentAnim[1] = 'idle';
                // Keep the character type (first part) and direction (third part), replace action (second part)
                this.player.play(`${this.characterType}-idle-${currentAnim[2]}`, true);
                if (this.isJoined) this.sendIdle(this.player.x, this.player.y, currentAnim[2]);
            }
            this.player.setVelocity(0, 0);
        }

        if (moved) {
            this.sendMovement(this.player.x, this.player.y, direction);
        }

        this.playerLabel.setPosition(this.player.x, this.player.y - 30);

        Object.values(this.players).forEach(({ sprite, label }) => {
            label.setPosition(sprite.x, sprite.y - 20); // Keep the label above the sprite
        });
    }
}
