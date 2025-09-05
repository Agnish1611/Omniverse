import { useSetRecoilState } from 'recoil';
import { useEffect, useCallback, useState } from 'react';
import Phaser from 'phaser';
import Game from '../scenes/Game';
import Preloader from '@/scenes/Preloader';
import Background from '@/scenes/Background';
import { currentUserAtom, User } from '@/store/currentUser';
import ChatBox from './ChatBox';
import { socketAtom } from '@/store/socketAtom';
import { messagesAtom } from '@/store/messages';
import { createMessage } from '@/messageHandler';

const GameComponent: React.FC = () => {
    const setMessage = useSetRecoilState(messagesAtom);
    const setCurrentUser = useSetRecoilState(currentUserAtom);
    const setSocket = useSetRecoilState(socketAtom);
    const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null);

    // Create a wrapped update function that creates proper Message objects
    const updateMessages = useCallback((user: string, text: string) => {
        const message = createMessage(user, text, 'chat');
        setMessage(prev => [...prev, message]);
    }, [setMessage]);

    // Create a wrapped function to handle user updates
    const handleSetCurrentUser = useCallback((userId: string) => {
        const user: User = {
            id: userId,
            name: userId, // Using userId as name for now, could be improved
        };
        setCurrentUser(user);
    }, [setCurrentUser]);

    useEffect(() => {
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
            scene: [Preloader, Background, new Game(updateMessages, handleSetCurrentUser, setSocket)],
        };

        const game = new Phaser.Game(config);
        setGameInstance(game);

        // Cleanup function to destroy the game when component unmounts
        return () => {
            if (game) {
                game.destroy(true);
                setGameInstance(null);
            }
        };
    }, [updateMessages, handleSetCurrentUser, setSocket]);

    return (
        <div 
            id="game-container" 
            className="relative w-full h-full"
        >
            <ChatBox gameInstance={gameInstance} />
        </div>
    );
};

export default GameComponent;
