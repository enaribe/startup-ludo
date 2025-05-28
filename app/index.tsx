import React, { useState } from 'react';
import LudoBoard from "./components/LudoBoard";
import MainMenu from "./components/MainMenu";
import SplashScreen from "./components/SplashScreen";
import GameModeSelectionScreen from "./screens/GameModeSelectionScreen";
import PlayerSelectionScreen from "./screens/PlayerSelectionScreen";

type AppState = 'splash' | 'menu' | 'modeSelection' | 'playerSelection' | 'game';
type GameMode = 'online' | 'friends' | 'simple';

export default function Index() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [selectedMode, setSelectedMode] = useState<GameMode>('simple');

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
    // Ici on peut passer le nombre de joueurs au jeu
    setAppState('game');
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

  return <LudoBoard />;
}
