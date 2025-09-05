import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "./types";

function generateRandomId(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export class User {
    public id: string;
    public name: string;
    private spaceId?: string;
    public x: number;
    public y: number;

    constructor(private ws: WebSocket) {
        this.id = generateRandomId(10);
        this.name = this.id; // Default to ID, will be updated when user sets name
        this.x = 0;
        this.y = 0;
        this.initHandlers();
    }

    initHandlers() {
        this.ws.on("message", (data) => {
            const parsedData = JSON.parse(data.toString());
            switch (parsedData.type) {
                case 'set-name':
                    this.name = parsedData.payload.name;
                    break;
                    
                case 'join':
                    const spaceId = parsedData.payload.spaceId;
                    this.spaceId = spaceId;
                    this.x = 190;
                    this.y = 190;

                    RoomManager.getInstance().addUser(spaceId, this);

                    this.send({
                        type: "space-joined",
                        payload: {
                            spawn: { x: this.x, y: this.y },
                            users: RoomManager.getInstance()
                                .rooms.get(spaceId)
                                ?.filter((u: User) => u.id !== this.id)
                                .map((u: User) => ({ id: u.id, name: u.name, x: u.x, y: u.y })) || [],
                            currentUser: this.id
                        }
                    });

                    RoomManager.getInstance().broadcast({
                        type: "user-joined",
                        payload: {
                            userId: this.id,
                            userName: this.name,
                            x: this.x,
                            y: this.y
                        }
                    }, this, this.spaceId!);
                    break;

                case 'move':
                    this.x = parsedData.payload.x;
                    this.y = parsedData.payload.y;
                    const direction = parsedData.payload.direction;

                    RoomManager.getInstance().broadcast({
                        type: 'move',
                        payload: {
                            userId: this.id,  
                            x: this.x,
                            y: this.y,
                            direction: direction,
                        }
                    }, this, this.spaceId!);
                    break;
                case 'idle':
                    this.x = parsedData.payload.x;
                    this.y = parsedData.payload.y;
                    const idle_direction = parsedData.payload.direction;
    
                    RoomManager.getInstance().broadcast({
                        type: 'user-idle',
                        payload: {
                            userId: this.id, 
                            x: this.x,
                            y: this.y,
                            direction: idle_direction
                        }
                    }, this, this.spaceId!);
                    break;
                case 'chat-message':
                    const text = parsedData.payload.text;
                    const id = parsedData.payload.sender;
        
                    RoomManager.getInstance().broadcastAll({
                        type: 'receive-message',
                        payload: {
                            id: id,
                            text: text                        }
                    }, this, this.spaceId!);
                    break;
            }
        });
    }

    destroy() {
        RoomManager.getInstance().broadcast({
            type: 'user-left',
            payload: {
                userId: this.id
            }
        }, this, this.spaceId!);
        RoomManager.getInstance().removeUser(this, this.spaceId!);
    }

    send(payload: OutgoingMessage) {
        this.ws.send(JSON.stringify(payload));
    }
}
