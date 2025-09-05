import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRecoilState, useRecoilValue } from 'recoil';
import { messagesAtom } from '@/store/messages';
import { currentUserAtom } from '@/store/currentUser';
import { socketAtom } from '@/store/socketAtom';
import { createMessage, createWebSocketMessage } from '@/messageHandler';

interface ChatBoxProps {
  gameInstance?: Phaser.Game | null;
}

const ChatBox: React.FC<ChatBoxProps> = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>('');
  const [messages, setMessages] = useRecoilState(messagesAtom);
  const currentUser = useRecoilValue(currentUserAtom);
  const socket = useRecoilValue(socketAtom);
  const chatboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleChatBox = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!message.trim() || !currentUser || !socket) {
      return;
    }

    if (socket.readyState === WebSocket.OPEN) {
      const webSocketMessage = createWebSocketMessage('chat-message', {
        sender: currentUser.name,
        text: message.trim(),
        userId: currentUser.id,
      });

      socket.send(JSON.stringify(webSocketMessage));
      
      // Add message to local state immediately for better UX
      const localMessage = createMessage(currentUser.name, message.trim(), 'chat');
      setMessages(prev => [...prev, localMessage]);
    } else {
      console.error('WebSocket is not connected.');
      // Maybe show a user-friendly error message
    }
  }, [currentUser, socket, setMessages]);

  const handleInputSubmit = useCallback(() => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  }, [inputValue, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  }, [handleInputSubmit]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTo({
        top: chatboxRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!currentUser) {
    return null; // Don't render chat if no user is logged in
  }

  return (
    <div className="fixed bottom-0 left-0 z-10">
      {/* Chat toggle button */}
      <div className="mb-4 ml-4 flex gap-2">
        <Button 
          onClick={toggleChatBox} 
          className="bg-transparent hover:bg-transparent hover:scale-110 transition-transform"
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          <img src="images/chat (3).png" alt="Chat" className="h-10 w-10" />
        </Button>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-20 w-80 max-h-[80vh] flex flex-col">
          <Card className="flex-1 flex flex-col bg-zinc-900 max-h-[80vh] shadow-lg">
            {/* Messages area */}
            <CardContent 
              ref={chatboxRef}
              className="flex-1 overflow-y-auto flex flex-col gap-2 p-4 text-xs font-semibold max-h-[60vh]"
            >
              {messages.length === 0 ? (
                <div className="text-zinc-500 text-center py-4">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 text-xs font-bold">
                        {message.user}
                      </span>
                      <span className="text-zinc-500 text-xs">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-lg text-white bg-zinc-800 max-w-[90%]">
                      {message.text}
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* Input area */}
            <CardContent className="flex gap-2 p-4 border-t border-zinc-700">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 text-xs text-white font-semibold rounded-xl bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                maxLength={500}
              />
              <Button 
                onClick={handleInputSubmit}
                disabled={!inputValue.trim()}
                className="text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <img src="images/send (3).png" alt="Send" className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChatBox;