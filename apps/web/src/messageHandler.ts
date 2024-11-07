// messageHandler.ts

import { messagesAtom } from '@/store/Messages';
import { RecoilState, SetterOrUpdater } from 'recoil';

interface Message {
    user: string,
    text: string
}

// Define a function that receives the setMessage function
export function updateMessages(setMessage: SetterOrUpdater<Message[]>, newMessage: Message) {
    setMessage((prevMessages) => [...prevMessages, newMessage]);
}
