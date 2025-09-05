import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRecoilState, useRecoilValue } from 'recoil';
import { messagesAtom } from '@/store/messages';
import { currentUserAtom } from '@/store/currentUser';
import { socketAtom } from '@/store/socketAtom';
const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [messages, setMessages] = useRecoilState(messagesAtom);
    const currentUser = useRecoilValue(currentUserAtom);
    const socket = useRecoilValue(socketAtom);
    const toggleChatBox = () => {
        setIsOpen(!isOpen);
    };
    const sendMessage = (message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            // Send the message through the WebSocket connection
            socket.send(JSON.stringify({
                type: 'chat-message',
                payload: {
                    sender: currentUser,
                    text: message,
                }
            }));
        }
        else {
            console.error('WebSocket is not connected.');
        }
    };
    useEffect(() => {
        const chatbox = document.getElementById('chatbox');
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }, [messages]);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed bottom-0 left-0 mb-4 ml-4 z-10", children: _jsx(Button, { onClick: toggleChatBox, className: 'bg-transparent hover:bg-transparent hover:scale-110 transition', children: _jsx("img", { src: 'images/chat (3).png', className: 'h-10 w-10' }) }) }), isOpen && (_jsx("div", { className: "fixed bottom-20 left-20 mb-4 mr-4 z-20 w-80 max-h-[80vh] flex flex-col", children: _jsxs(Card, { className: "flex-1 flex flex-col bg-zinc-900 max-h-[80vh]", children: [_jsx(CardContent, { className: "flex-1 overflow-y-auto flex flex-col gap-2 p-5 text-xs font-semibold", id: 'chatbox', children: messages && messages.map((message, index) => (_jsxs("div", { className: 'flex justify-start', children: [_jsx("div", { className: 'text-purple-400 text-xs font-bold flex items-center', children: message.user }), _jsx("div", { className: 'px-4 py-2 rounded-lg text-white', children: message.text })] }, index))) }), _jsxs(CardContent, { className: "flex gap-2 p-4", children: [_jsx("input", { type: "text", placeholder: "Type your message...", className: "flex-1 px-3 py-1 text-xs text-white font-semibold rounded-xl bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700", onKeyDown: (e) => {
                                        if (e.key === 'Enter' && e.target.value) {
                                            sendMessage(e.target.value);
                                            e.target.value = '';
                                        }
                                    } }), _jsx(Button, { className: 'text-xs font-bold', onClick: () => { if (document.querySelector('input').value)
                                        sendMessage(document.querySelector('input').value); }, children: _jsx("img", { src: 'images/send (3).png', className: 'h-5 w-5' }) })] })] }) }))] }));
};
export default ChatBox;
