// import Phaser from 'phaser'

// import Game from './scenes/Game';
// import Preloader from './scenes/Preloader';

// const config = {
// 	type: Phaser.AUTO,
// 	parent: 'game-container',
// 	width: window.innerWidth,
// 	height: window.innerHeight,
// 	physics: {
// 		default: 'arcade',
// 		arcade: {
// 			gravity: { y: 0 },
// 		},
// 	},
// 	scene: [Preloader, Game],
//     scale: {
//         zoom: 1
//     }
// }

// export default new Phaser.Game(config)

// GameComponent.tsx
import { useSetRecoilState } from 'recoil';
import { messagesAtom } from '@/store/Messages';
import { useEffect } from 'react';
import Phaser from 'phaser';
import Game from '../scenes/Game';
import { updateMessages } from '../messageHandler';
import Preloader from '@/scenes/Preloader';
import { currentUserAtom } from '@/store/currentUser';
import ChatBox from './ChatBox';
import { socketAtom } from '@/store/socketAtom';

const GameComponent: React.FC = () => {
    const setMessage = useSetRecoilState(messagesAtom);
    const setCurrentUser = useSetRecoilState(currentUserAtom);
    const setSocket = useSetRecoilState(socketAtom);

    useEffect(() => {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: 'game-container',
			width: window.innerWidth,
			height: window.innerHeight,
			physics: {
				default: 'arcade',
				arcade: {
					gravity: { y: 0 },
				},
			},
            scene: [Preloader, new Game(updateMessages.bind(null, setMessage), setCurrentUser, setSocket)], // Pass the updateMessages function to Game
        };

        const game = new Phaser.Game(config);

        return () => {
            game.destroy(true);
        };
    }, [setMessage, setCurrentUser]);

    return (<div id="game-container">
        <ChatBox />
    </div>);
};

export default GameComponent;
