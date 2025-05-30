import React, { useState } from 'react';
import MainMenu from "./components/MainMenu";
import SplashScreen from "./components/SplashScreen";
import GameModeSelectionScreen from "./screens/GameModeSelectionScreen";
import GameScreen from "./screens/GameScreen";
import ManualSectorSelectionScreen from "./screens/ManualSectorSelectionScreen";
import PlayerSelectionScreen from "./screens/PlayerSelectionScreen";
import RandomCardScreen from "./screens/RandomCardScreen";
import SectorSelectionModeScreen from "./screens/SectorSelectionModeScreen";

type AppState = 'splash' | 'menu' | 'modeSelection' | 'playerSelection' | 'sectorModeSelection' | 'randomCard' | 'manualSectorSelection' | 'game';
type GameMode = 'online' | 'friends' | 'simple';
type SectorSelectionMode = 'random' | 'manual';

export default function Index() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [selectedMode, setSelectedMode] = useState<GameMode>('simple');
  const [numberOfPlayers, setNumberOfPlayers] = useState<1 | 2 | 3 | 4>(1);
  const [selectedEdition, setSelectedEdition] = useState<string>('Agri');
  const [sectorSelectionMode, setSectorSelectionMode] = useState<SectorSelectionMode>('random');

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
    // Après la sélection du nombre de joueurs, aller au choix du mode de sélection de secteur
    setAppState('sectorModeSelection');
  };

  const handleSectorModeSelection = (mode: SectorSelectionMode) => {
    setSectorSelectionMode(mode);
    if (mode === 'random') {
      // Mode aléatoire : aller au tirage de carte
      setAppState('randomCard');
    } else {
      // Mode manuel : aller à la sélection manuelle
      setAppState('manualSectorSelection');
    }
  };

  const handleManualSectorSelection = (edition: string) => {
    // Sauvegarder l'édition sélectionnée manuellement et lancer le jeu
    setSelectedEdition(edition);
    setAppState('game');
  };

  const handleBackToPlayerSelection = () => {
    // Retourner à la sélection du nombre de joueurs
    setAppState('playerSelection');
  };

  const handleBackToSectorModeSelection = () => {
    // Retourner au choix du mode de sélection
    setAppState('sectorModeSelection');
  };

  const handleStartFinalGame = (edition: string) => {
    // Sauvegarder l'édition sélectionnée et lancer le jeu final (mode aléatoire)
    setSelectedEdition(edition);
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

  if (appState === 'sectorModeSelection') {
    return <SectorSelectionModeScreen onSelectMode={handleSectorModeSelection} onBack={handleBackToPlayerSelection} />;
  }

  if (appState === 'randomCard') {
    return <RandomCardScreen onStartGame={handleStartFinalGame} />;
  }

  if (appState === 'manualSectorSelection') {
    return <ManualSectorSelectionScreen onSelectEdition={handleManualSectorSelection} onBack={handleBackToSectorModeSelection} />;
  }

  return <GameScreen numberOfPlayers={numberOfPlayers} selectedEdition={selectedEdition} onResetGame={handleResetGame} />;
}
