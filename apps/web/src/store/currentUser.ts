import { atom } from "recoil";

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export const currentUserAtom = atom<User | null>({
    key: 'currentUserAtom',
    default: null
})