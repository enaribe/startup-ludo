import React, { useState } from 'react';
import GameScreen from '../screens/GameScreen';
import PlayerSelectionScreen from '../screens/PlayerSelectionScreen';

const LudoBoard: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [numberOfPlayers, setNumberOfPlayers] = useState<1 | 2 | 3 | 4>(4);

  const handleStartGame = (players: 1 | 2 | 3 | 4) => {
    setNumberOfPlayers(players);
    setGameStarted(true);
  };

  const handleResetGame = () => {
    setGameStarted(false);
  };

  if (!gameStarted) {
    return <PlayerSelectionScreen onStartGame={handleStartGame} />;
  }

  return (
    <GameScreen 
      numberOfPlayers={numberOfPlayers} 
      onResetGame={handleResetGame} 
    />
  );
};

export default LudoBoard;