import { useEffect, useRef, useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { socketAtom } from '@/store/socketAtom';
import { currentUserAtom } from '@/store/currentUser';
import { messagesAtom } from '@/store/messages';
import { WebSocketMessage, WebSocketConnectionState } from '@/types/websocket';
import { createMessage } from '@/messageHandler';

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  connectionState: WebSocketConnectionState;
  sendMessage: (message: WebSocketMessage) => void;
  isConnected: boolean;
}

export function useWebSocket(url?: string): UseWebSocketReturn {
  const [socket, setSocket] = useRecoilState(socketAtom);
  const currentUser = useRecoilValue(currentUserAtom);
  const [, setMessages] = useRecoilState(messagesAtom);
  const connectionStateRef = useRef<WebSocketConnectionState>('disconnected');

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [socket]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat-message') {
        const message = createMessage(
          data.payload.sender || 'Unknown',
          data.payload.text || '',
          'chat'
        );
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [setMessages]);

  useEffect(() => {
    if (!url || !currentUser) return;

    connectionStateRef.current = 'connecting';
    const ws = new WebSocket(url);

    ws.onopen = () => {
      connectionStateRef.current = 'connected';
      setSocket(ws);
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      connectionStateRef.current = 'disconnected';
      setSocket(null);
    };

    ws.onerror = () => {
      connectionStateRef.current = 'error';
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url, currentUser, setSocket, handleMessage]);

  return {
    socket,
    connectionState: connectionStateRef.current,
    sendMessage,
    isConnected: socket?.readyState === WebSocket.OPEN
  };
}
