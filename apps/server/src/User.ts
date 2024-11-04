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
    private spaceId?: string;
    public x: number;
    public y: number;

    constructor(private ws: WebSocket) {
        this.id = generateRandomId(10);
        this.x = 0;
        this.y = 0;
        this.initHandlers();
    }

    initHandlers() {
        this.ws.on("message", (data) => {
            const parsedData = JSON.parse(data.toString());
            switch (parsedData.type) {
                case 'join':
                    const spaceId = parsedData.payload.spaceId;
                    this.spaceId = spaceId;
                    this.x = 200 + Math.floor(Math.random() * 100);
                    this.y = 200 + Math.floor(Math.random() * 100);

                    // Add the user to the room
                    RoomManager.getInstance().addUser(spaceId, this);

                    // Send initial spawn and user list to this user
                    this.send({
                        type: "space-joined",
                        payload: {
                            spawn: { x: this.x, y: this.y },
                            users: RoomManager.getInstance()
                                .rooms.get(spaceId)
                                ?.filter((u: User) => u.id !== this.id)
                                .map((u: User) => ({ id: u.id, x: u.x, y: u.y })) || []
                        }
                    });

                    // Notify others in the room about the new user
                    RoomManager.getInstance().broadcast({
                        type: "user-joined",
                        payload: {
                            userId: this.id,
                            x: this.x,
                            y: this.y
                        }
                    }, this, this.spaceId!);
                    break;

                case 'move':
                    // Update position and broadcast to others
                    this.x = parsedData.payload.x;
                    this.y = parsedData.payload.y;
                    const direction = parsedData.payload.direction;

                    RoomManager.getInstance().broadcast({
                        type: 'move',
                        payload: {
                            userId: this.id,  // Include the userId so clients know who moved
                            x: this.x,
                            y: this.y,
                            direction: direction,
                        }
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
