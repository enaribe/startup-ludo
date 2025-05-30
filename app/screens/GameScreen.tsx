import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet, useWindowDimensions } from 'react-native';
import EventPopup from '../components/EventPopup';
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
    closeEventPopup,
    handleQuizAnswer,
    executeChallengeMoveBack,
    getDuelOpponent,
    handleDuelVote,
    getDuelVoters,
  } = useGameLogic(numberOfPlayers);

  // Debug: Log de l'état du popup
  useEffect(() => {
    console.log('GameScreen - Popup visible:', gameState.showEventPopup, 'Type:', gameState.currentEventType);
  }, [gameState.showEventPopup, gameState.currentEventType]);

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
        !gameState.showEventPopup && // Attendre que les popups se ferment
        gameState.diceValue === null) { // Seulement si le dé n'a pas encore été lancé
      
      const timer = setTimeout(() => {
        console.log('🎮 Déclenchement automatique du tour de l\'ordinateur');
        computerPlay(cellSize);
      }, 500); // Petit délai pour éviter les conflits
      
      return () => clearTimeout(timer);
    }
  }, [
    gameState.currentPlayer, 
    gameState.rolling, 
    gameState.isAnimating, 
    gameState.gameFinished, 
    gameState.diceValue,
    gameState.showEventPopup // Ajouter showEventPopup aux dépendances
  ]);

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

  // Configuration des joueurs avec adaptation pour le mode 1 joueur
  const getPlayerConfigs = () => {
    if (gameState.isComputerGame) {
      // En mode 1 joueur : mettre le joueur humain en bas pour faciliter l'accès
      return [
        { color: 'yellow' as const, name: getPlayerName('yellow'), position: 'bottomLeft' as const }, // Joueur humain en bas
        { color: 'red' as const, name: getPlayerName('red'), position: 'topRight' as const }, // Ordinateur en haut
      ];
    } else {
      // Configuration normale pour les autres modes
      return [
        { color: 'yellow' as const, name: getPlayerName('yellow'), position: 'topLeft' as const },
        { color: 'blue' as const, name: getPlayerName('blue'), position: 'topRight' as const },
        { color: 'green' as const, name: getPlayerName('green'), position: 'bottomLeft' as const },
        { color: 'red' as const, name: getPlayerName('red'), position: 'bottomRight' as const },
      ];
    }
  };

  const playerConfigs = getPlayerConfigs();

  // Gérer la fermeture du popup et le recul pour les challenges
  const handleEventPopupClose = async () => {
    const wasChallenge = gameState.currentEventType === 'challenge';
    closeEventPopup();
    
    // Si c'était un challenge, exécuter le recul après un petit délai
    if (wasChallenge) {
      setTimeout(() => {
        executeChallengeMoveBack(cellSize);
      }, 100);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <GameHeader onMenuPress={handleCompleteReset} />
      
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
            tokens={gameState.tokens[color]}
          />
        );
      })}

      <GameMessages
        message={gameState.message}
        gameFinished={gameState.gameFinished}
        onResetGame={handleCompleteReset}
      />

      <EventPopup
        visible={gameState.showEventPopup}
        eventType={gameState.currentEventType}
        tokenChange={gameState.lastTokenChange}
        eventData={gameState.currentEventData}
        pendingQuizTokens={gameState.pendingQuizTokens}
        onClose={handleEventPopupClose}
        onQuizAnswer={handleQuizAnswer}
        duelPlayers={gameState.duelPlayers}
        duelVoters={gameState.duelVoters}
        duelVotes={gameState.duelVotes}
        onDuelVote={handleDuelVote}
        quizAnswerSelected={gameState.quizAnswerSelected}
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