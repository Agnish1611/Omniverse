import { atom } from "recoil";

interface Message {
    user: string,
    text: string
}

export const messagesAtom = atom({
    key: 'messagesAtom',
    default: [] as Message[]
})