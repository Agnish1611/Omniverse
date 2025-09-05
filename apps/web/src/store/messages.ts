import { atom } from "recoil";

export interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  type?: 'chat' | 'system' | 'join' | 'leave';
}

export const messagesAtom = atom<Message[]>({
  key: "messagesAtom",
  default: [],
});