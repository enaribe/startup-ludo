import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet, useWindowDimensions } from 'react-native';
import GameBoard, { Cell } from '../components/GameBoard';
import GameHeader from '../components/GameHeader';
import GameMessages from '../components/GameMessages';
import PlayerCard from '../components/PlayerCard';
import useGameLogic from '../hooks/useGameLogic';

const BOARD_SIZE = 15;

interface GameScreenProps {
  numberOfPlayers: 1 | 2 | 3 | 4;
  onResetGame: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ numberOfPlayers, onResetGame }) => {
  const { width, height } = useWindowDimensions();
  const boardMaxSize = Math.min(width, height) * 0.95;
  const cellSize = Math.floor(boardMaxSize / BOARD_SIZE);

  const {
    gameState,
    pawnAnim,
    paths,
    resetGame,
    rollDice,
    syncPawnPositions,
    computerPlay,
  } = useGameLogic(numberOfPlayers);

  // Synchronise les positions des pions quand ils changent
  useEffect(() => {
    syncPawnPositions(cellSize);
  }, [gameState.pawns, cellSize]);

  // Déclenche automatiquement le tour de l'ordinateur
  useEffect(() => {
    if (gameState.isComputerGame && 
        gameState.computerPlayers.includes(gameState.currentPlayer) && 
        !gameState.rolling && 
        !gameState.isAnimating && 
        !gameState.gameFinished &&
        gameState.diceValue === null) { // Seulement si le dé n'a pas encore été lancé
      const timer = setTimeout(() => {
        computerPlay(cellSize);
      }, 500); // Petit délai pour éviter les conflits
      
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.rolling, gameState.isAnimating, gameState.gameFinished, gameState.diceValue]);

  // Déplacement du pion (clic sur la case du pion)
  const handleCellPress = (cell: Cell) => {
    if (!gameState.doitDeplacer) return;
    
    const pos = gameState.pawns[gameState.currentPlayer];
    if (pos === 'home' && cell.type === 'home' && cell.color === gameState.currentPlayer && (gameState.diceValue ?? 1) === 6) {
      // Logique de déplacement depuis la maison
      // Cette logique pourrait être déplacée dans le hook si nécessaire
    } else if (typeof pos === 'number') {
      // Logique de déplacement sur le plateau
      // Cette logique pourrait être déplacée dans le hook si nécessaire
    }
  };

  // Fonction pour gérer la réinitialisation complète (retour à l'écran de sélection)
  const handleCompleteReset = () => {
    resetGame();
    onResetGame();
  };

  // Configuration des joueurs avec leurs positions
  const getPlayerName = (color: string) => {
    if (gameState.isComputerGame) {
      return color === 'yellow' ? 'Vous' : 'Ordinateur';
    }
    switch (color) {
      case 'yellow': return 'Joueur 1';
      case 'blue': return 'Joueur 2';
      case 'red': return 'Joueur 3';
      case 'green': return 'Joueur 4';
      default: return 'Joueur';
    }
  };

  const playerConfigs = [
    { color: 'yellow' as const, name: getPlayerName('yellow'), position: 'topLeft' as const },
    { color: 'blue' as const, name: getPlayerName('blue'), position: 'topRight' as const },
    { color: 'green' as const, name: getPlayerName('green'), position: 'bottomLeft' as const },
    { color: 'red' as const, name: getPlayerName('red'), position: 'bottomRight' as const },
  ];

  return (
    <ImageBackground 
      source={require('../../assets/images/bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <GameHeader />
      
      <GameBoard
        cellSize={cellSize}
        currentPlayer={gameState.currentPlayer}
        pawns={gameState.pawns}
        activePlayers={gameState.activePlayers}
        pawnAnim={pawnAnim}
        paths={paths}
        onCellPress={handleCellPress}
      />

      {/* Cartes des joueurs - Affichage dynamique selon les joueurs actifs */}
      {playerConfigs.map(({ color, name, position }) => {
        if (!gameState.activePlayers.includes(color)) return null;
        
        const isComputerPlayer = gameState.isComputerGame && gameState.computerPlayers.includes(color);
        
        return (
          <PlayerCard
            key={color}
            color={color}
            playerName={name}
            position={position}
            isCurrentPlayer={gameState.currentPlayer === color}
            isFinished={gameState.finishedPlayers.includes(color)}
            finishedPosition={gameState.finishedPlayers.indexOf(color) + 1}
            diceValue={gameState.diceValue ?? 1}
            rolling={gameState.rolling}
            isAnimating={gameState.isAnimating}
            onRollDice={() => rollDice(cellSize)}
            isComputerPlayer={isComputerPlayer}
          />
        );
      })}

      <GameMessages
        message={gameState.message}
        gameFinished={gameState.gameFinished}
        onResetGame={handleCompleteReset}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GameScreen; 