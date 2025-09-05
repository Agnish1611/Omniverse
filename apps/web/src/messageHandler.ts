import { Message } from '@/store/messages';
import { SetterOrUpdater } from 'recoil';
import { WebSocketMessage } from '@/types/websocket';

export function updateMessages(setMessage: SetterOrUpdater<Message[]>, newMessage: Message): void {
    setMessage((prevMessages) => [...prevMessages, newMessage]);
}

export function createMessage(user: string, text: string, type: Message['type'] = 'chat'): Message {
    return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user,
        text,
        timestamp: new Date(),
        type
    };
}

export function createWebSocketMessage(type: WebSocketMessage['type'], payload: WebSocketMessage['payload']): WebSocketMessage {
    return {
        type,
        payload: {
            ...payload,
            timestamp: new Date().toISOString()
        }
    };
}
