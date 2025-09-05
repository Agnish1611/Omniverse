import { useSetRecoilState } from 'recoil';
import { useEffect, useCallback } from 'react';
import Phaser from 'phaser';
import Game from '../scenes/Game';
import Preloader from '@/scenes/Preloader';
import Background from '@/scenes/Background';
import { currentUserAtom, User } from '@/store/currentUser';
import ChatBox from './ChatBox';
import { socketAtom } from '@/store/socketAtom';
import { messagesAtom } from '@/store/messages';
import { createMessage } from '@/messageHandler';

interface GameComponentProps {
    playerName: string;
    selectedCharacter: string;
}

const GameComponent: React.FC<GameComponentProps> = ({ playerName, selectedCharacter }) => {
    const setMessage = useSetRecoilState(messagesAtom);
    const setCurrentUser = useSetRecoilState(currentUserAtom);
    const setSocket = useSetRecoilState(socketAtom);

    // Create a wrapped update function that creates proper Message objects
    const updateMessages = useCallback((user: string, text: string) => {
        const message = createMessage(user, text, 'chat');
        setMessage(prev => [...prev, message]);
    }, [setMessage]);

    // Create a wrapped function to handle user ID updates (keeping the name from playerName)
    const handleSetCurrentUser = useCallback((userId: string) => {
        console.log('handleSetCurrentUser called with userId:', userId);
        setCurrentUser(prevUser => {
            const newUser = {
                id: userId,
                name: prevUser?.name || playerName, // Keep existing name or use playerName
            };
            console.log('Setting user:', newUser);
            return newUser;
        });
    }, [playerName]);

    useEffect(() => {
        // Set the initial user with the player name
        const initialUser: User = {
            id: '', // Will be set by the server
            name: playerName,
        };
        setCurrentUser(initialUser);

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: window.innerWidth,
            height: window.innerHeight,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                },
            },
            scene: [Preloader, Background, new Game(updateMessages, handleSetCurrentUser, setSocket, playerName, selectedCharacter)],
        };

        const game = new Phaser.Game(config);

        // Cleanup function to destroy the game when component unmounts
        return () => {
            if (game) {
                game.destroy(true);
            }
        };
    }, [updateMessages, handleSetCurrentUser, setSocket]);

    return (
        <div 
            id="game-container" 
            className="relative w-full h-full"
        >
            <ChatBox />
        </div>
    );
};

export default GameComponent;
