import { OutgoingMessage } from "./types";
import type { User } from "./User";

export class RoomManager {
    rooms: Map<string, User[]> = new Map();
    static instance: RoomManager;

    private constructor() {}

    static getInstance() {
        if (!this.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }

    public removeUser(user: User, spaceId: string) {
        if (!this.rooms.has(spaceId)) return;
        
        this.rooms.set(spaceId, (this.rooms.get(spaceId)?.filter((u) => u.id !== user.id) || []));
    }

    public addUser(spaceId: string, user: User) {
        if (!this.rooms.has(spaceId)) {
            this.rooms.set(spaceId, [user]);
            return;
        }
        this.rooms.get(spaceId)!.push(user);
    }

    public broadcast(message: OutgoingMessage, sender: User, spaceId: string) {
        if (!this.rooms.has(spaceId)) return;

        this.rooms.get(spaceId)!.forEach((user) => {
            if (user.id !== sender.id) {
                user.send(message);
            }
        });
    }

    public broadcastAll(message: OutgoingMessage, sender: User, spaceId: string) {
        if (!this.rooms.has(spaceId)) return;

        this.rooms.get(spaceId)!.forEach((user) => {
                user.send(message);
        });
    }
}
