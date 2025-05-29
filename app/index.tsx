import React, { useState } from 'react';
import MainMenu from "./components/MainMenu";
import SplashScreen from "./components/SplashScreen";
import GameModeSelectionScreen from "./screens/GameModeSelectionScreen";
import GameScreen from "./screens/GameScreen";
import PlayerSelectionScreen from "./screens/PlayerSelectionScreen";
import RandomCardScreen from "./screens/RandomCardScreen";

type AppState = 'splash' | 'menu' | 'modeSelection' | 'playerSelection' | 'randomCard' | 'game';
type GameMode = 'online' | 'friends' | 'simple';

export default function Index() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [selectedMode, setSelectedMode] = useState<GameMode>('simple');
  const [numberOfPlayers, setNumberOfPlayers] = useState<1 | 2 | 3 | 4>(1);

  const handleSplashFinish = () => {
    setAppState('menu');
  };

  const handleStartGame = () => {
    setAppState('modeSelection');
  };

  const handleModeSelection = (mode: GameMode) => {
    setSelectedMode(mode);
    if (mode === 'simple') {
      // Pour le mode simple, aller directement à la sélection du nombre de joueurs
      setAppState('playerSelection');
    } else {
      // Pour les autres modes, on peut implémenter la logique plus tard
      setAppState('playerSelection');
    }
  };

  const handlePlayerSelection = (players: 1 | 2 | 3 | 4) => {
    // Sauvegarder le nombre de joueurs sélectionné
    setNumberOfPlayers(players);
    // Après la sélection du nombre de joueurs, aller au tirage de carte secteur
    setAppState('randomCard');
  };

  const handleStartFinalGame = () => {
    // Lancer le jeu final directement depuis RandomCardScreen
    setAppState('game');
  };

  const handleResetGame = () => {
    // Retourner au menu principal quand on quitte le jeu
    setAppState('menu');
  };

  if (appState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (appState === 'menu') {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  if (appState === 'modeSelection') {
    return <GameModeSelectionScreen onSelectMode={handleModeSelection} />;
  }

  if (appState === 'playerSelection') {
    return <PlayerSelectionScreen onStartGame={handlePlayerSelection} />;
  }

  if (appState === 'randomCard') {
    return <RandomCardScreen onStartGame={handleStartFinalGame} />;
  }

  return <GameScreen numberOfPlayers={numberOfPlayers} onResetGame={handleResetGame} />;
}
