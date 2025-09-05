import { useState, useCallback } from 'react';
import GameComponent from "./components/GameComponent"
import NameDialog from "./components/NameDialog"

function App() {
  const [playerName, setPlayerName] = useState<string>('');
  const [showGame, setShowGame] = useState<boolean>(false);

  const handleNameSubmit = useCallback((name: string) => {
    setPlayerName(name);
    setShowGame(true);
  }, []);

  if (!showGame) {
    return <NameDialog onNameSubmit={handleNameSubmit} />;
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative'
    }}>
      <GameComponent playerName={playerName} />
    </div>
  )
}

export default App