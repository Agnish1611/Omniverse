import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { messagesAtom } from '@/store/Messages';
import { currentUserAtom } from '@/store/currentUser';
import Game from '@/scenes/Game';
import { updateMessages } from '@/messageHandler';

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useRecoilState(messagesAtom);
  const currentUser = useRecoilValue(currentUserAtom);

  const toggleChatBox = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = (message) => {
    setMessages([...messages, { user: currentUser, text: message }]);
  }

  useEffect(() => {
    const chatbox = document.getElementById('chatbox');
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }, [messages]);

  return (
    <>
      <div className="fixed bottom-0 left-0 mb-4 ml-4 z-10">
        <Button onClick={toggleChatBox} className='bg-transparent hover:bg-transparent hover:scale-110 transition'>
          <img src='images/chat (3).png' className='h-10 w-10' />
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-20 left-20 mb-4 mr-4 z-20 w-80 max-h-[80vh] flex flex-col">
          <Card className="flex-1 flex flex-col bg-zinc-900 max-h-[80vh]">
            <CardContent className="flex-1 overflow-y-auto flex flex-col gap-2 p-5 text-xs font-semibold" id='chatbox'>
              {messages && messages.map((message, index) => (
                <div
                  key={index}
                  className='flex justify-start'
                >
                    <div className='text-purple-400 text-xs font-bold flex items-center'>{message.user}</div>
                    <div className='px-4 py-2 rounded-lg text-white'>{message.text}</div>
                </div>
              ))}
            </CardContent>
            <CardContent className="flex gap-2 p-4">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 px-3 py-1 text-xs text-white font-semibold rounded-xl bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    sendMessage(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <Button className='text-xs font-bold' onClick={() => {if(document.querySelector('input').value) sendMessage(document.querySelector('input').value)}}>
                <img src='images/send (3).png' className='h-5 w-5' />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatBox;