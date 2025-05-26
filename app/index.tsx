import React, { useState } from 'react';
import LudoBoard from "./components/LudoBoard";
import MainMenu from "./components/MainMenu";
import SplashScreen from "./components/SplashScreen";

type AppState = 'splash' | 'menu' | 'game';

export default function Index() {
  const [appState, setAppState] = useState<AppState>('splash');

  const handleSplashFinish = () => {
    setAppState('menu');
  };

  const handleStartGame = () => {
    setAppState('game');
  };

  if (appState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (appState === 'menu') {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  return <LudoBoard />;
}
