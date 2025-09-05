export interface WebSocketMessage {
  type: 'chat-message' | 'user-join' | 'user-leave' | 'system-message';
  payload: {
    sender?: string;
    text: string;
    timestamp?: string;
    userId?: string;
  };
}

export interface ChatMessagePayload {
  sender: string;
  text: string;
  timestamp: string;
  userId: string;
}

export interface SystemMessagePayload {
  text: string;
  type: 'join' | 'leave' | 'error' | 'info';
}

export type WebSocketConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';
