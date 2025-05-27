import { useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

export type PlayerColor = 'yellow' | 'blue' | 'red' | 'green';
export type PawnPosition = 'home' | number;

interface GameState {
  numberOfPlayers: 1 | 2 | 3 | 4;
  activePlayers: PlayerColor[];
  currentPlayer: PlayerColor;
  diceValue: number | null;
  rolling: boolean;
  pawns: Record<PlayerColor, PawnPosition>;
  doitDeplacer: boolean;
  message: string | null;
  isAnimating: boolean;
  finishedPlayers: PlayerColor[];
  gameFinished: boolean;
  isComputerGame: boolean;
  computerPlayers: PlayerColor[];
}

const useGameLogic = (numberOfPlayers: 1 | 2 | 3 | 4 = 4) => {
  // Configuration des joueurs actifs selon le nombre choisi
  const getActivePlayers = (players: 1 | 2 | 3 | 4): PlayerColor[] => {
    switch (players) {
      case 1:
        return ['yellow', 'red']; // Joueur humain (yellow) vs Ordinateur (red)
      case 2:
        return ['yellow', 'red'];
      case 3:
        return ['yellow', 'blue', 'red'];
      case 4:
      default:
        return ['yellow', 'blue', 'red', 'green'];
    }
  };

  // Configuration des joueurs ordinateur selon le nombre choisi
  const getComputerPlayers = (players: 1 | 2 | 3 | 4): PlayerColor[] => {
    switch (players) {
      case 1:
        return ['red']; // Seul l'ordinateur joue rouge
      default:
        return []; // Pas de joueurs ordinateur dans les autres modes
    }
  };

  // État du jeu
  const [gameState, setGameState] = useState<GameState>({
    numberOfPlayers,
    activePlayers: getActivePlayers(numberOfPlayers),
    currentPlayer: getActivePlayers(numberOfPlayers)[0],
    diceValue: null,
    rolling: false,
    pawns: {
      yellow: 'home',
      blue: 'home',
      red: 'home',
      green: 'home',
    },
    doitDeplacer: false,
    message: null,
    isAnimating: false,
    finishedPlayers: [],
    gameFinished: false,
    isComputerGame: numberOfPlayers === 1,
    computerPlayers: getComputerPlayers(numberOfPlayers),
  });

  // Animations des pions
  const [pawnAnim] = useState({
    yellow: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    blue: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    red: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    green: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
  });

  // Chemins des pions
  const paths: Record<string, Array<{ row: number; col: number }>> = {
    yellow: [
      { row: 6, col: 1 },
      { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
      { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 },
      { row: 1, col: 6 }, { row: 0, col: 6 }, { row: 0, col: 7 }, { row: 0, col: 8 },
      { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 },
      { row: 5, col: 8 }, { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 },
      { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 }, { row: 7, col: 14 },
      { row: 8, col: 14 }, { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 },
      { row: 8, col: 10 }, { row: 8, col: 9 }, { row: 9, col: 8 }, { row: 10, col: 8 },
      { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 }, { row: 14, col: 8 },
      { row: 14, col: 7 }, { row: 14, col: 6 }, { row: 13, col: 6 }, { row: 12, col: 6 },
      { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 5 },
      { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 },
      { row: 8, col: 0 }, { row: 7, col: 0 },
      { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 },
      { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 },
    ],
    blue: [
      { row: 1, col: 8 },
      { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 },
      { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 },
      { row: 6, col: 13 }, { row: 6, col: 14 }, { row: 7, col: 14 }, { row: 8, col: 14 },
      { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 },
      { row: 8, col: 9 }, { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 },
      { row: 12, col: 8 }, { row: 13, col: 8 }, { row: 14, col: 8 }, { row: 14, col: 7 },
      { row: 14, col: 6 }, { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 },
      { row: 10, col: 6 }, { row: 9, col: 6 }, { row: 8, col: 5 }, { row: 8, col: 4 },
      { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
      { row: 7, col: 0 }, { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 },
      { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 5, col: 6 },
      { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 },
      { row: 0, col: 6 }, { row: 0, col: 7 },
      { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 },
      { row: 4, col: 7 }, { row: 5, col: 7 }, { row: 6, col: 7 },
    ],
    red: [
      { row: 8, col: 13 },
      { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 },
      { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 },
      { row: 13, col: 8 }, { row: 14, col: 8 }, { row: 14, col: 7 }, { row: 14, col: 6 },
      { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 },
      { row: 9, col: 6 }, { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 },
      { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 }, { row: 7, col: 0 },
      { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 },
      { row: 6, col: 4 }, { row: 6, col: 5 }, { row: 5, col: 6 }, { row: 4, col: 6 },
      { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
      { row: 0, col: 7 }, { row: 0, col: 8 }, { row: 1, col: 8 }, { row: 2, col: 8 },
      { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 9 },
      { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 },
      { row: 6, col: 14 }, { row: 7, col: 14 },
      { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 },
      { row: 7, col: 10 }, { row: 7, col: 9 }, { row: 7, col: 8 },
    ],
    green: [
      { row: 13, col: 6 },
      { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 },
      { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 },
      { row: 8, col: 1 }, { row: 8, col: 0 }, { row: 7, col: 0 }, { row: 6, col: 0 },
      { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 },
      { row: 6, col: 5 }, { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 },
      { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 }, { row: 0, col: 7 },
      { row: 0, col: 8 }, { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 },
      { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 9 }, { row: 6, col: 10 },
      { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 },
      { row: 7, col: 14 }, { row: 8, col: 14 }, { row: 8, col: 13 }, { row: 8, col: 12 },
      { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 }, { row: 9, col: 8 },
      { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 },
      { row: 14, col: 8 }, { row: 14, col: 7 },
      { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 },
      { row: 10, col: 7 }, { row: 9, col: 7 }, { row: 8, col: 7 },
    ]
  };

  // Fonction utilitaire pour attendre un délai
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Fonction utilitaire pour obtenir la position pixel d'une case
  const getCellPosition = (color: PlayerColor, pos: PawnPosition, cellSize: number) => {
    if (pos === 'home') {
      if (color === 'yellow') return { x: cellSize * 3 - cellSize * 1.0, y: cellSize * 3 - cellSize * 1.0 };
      if (color === 'blue') return { x: cellSize * 12 - cellSize * 1.0, y: cellSize * 3 - cellSize * 1.0 };
      if (color === 'red') return { x: cellSize * 12 - cellSize * 1.0, y: cellSize * 12 - cellSize * 1.0 };
      if (color === 'green') return { x: cellSize * 3 - cellSize * 1.0, y: cellSize * 12 - cellSize * 1.0 };
      return { x: 0, y: 0 };
    } else if (typeof pos === 'number' && paths[color][pos]) {
      const { row, col } = paths[color][pos];
      const pawnSize = cellSize * 0.5;
      const centerOffset = (cellSize - pawnSize) / 2;
      return { x: col * cellSize + centerOffset, y: row * cellSize + centerOffset };
    }
    return { x: 0, y: 0 };
  };

  // Met à jour la position animée d'un pion
  const movePawnAnimated = async (color: PlayerColor, from: number, to: number, cellSize: number) => {
    setGameState(prev => ({ ...prev, isAnimating: true }));
    
    const startCoords = getCellPosition(color, from, cellSize);
    pawnAnim[color].setValue(startCoords);

    const step = from < to ? 1 : -1;
    let current = from;
    while (current !== to) {
      current += step;
      const pos = getCellPosition(color, current, cellSize);
      await new Promise(resolve => {
        Animated.timing(pawnAnim[color], {
          toValue: { x: pos.x, y: pos.y },
          duration: 220,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }).start(() => resolve(true));
      });
      await wait(30);
    }
    
    setGameState(prev => ({ 
      ...prev, 
      pawns: { ...prev.pawns, [color]: to },
      isAnimating: false 
    }));
  };

  // Fonction pour vérifier si une case est sûre
  const isSafeCell = (row: number, col: number) => {
    return false; // Plus de cases sûres
  };

  // Fonction pour gérer la capture d'un pion adverse
  const handleCapture = (color: PlayerColor, pos: number) => {
    const { row, col } = paths[color][pos];
    if (!isSafeCell(row, col)) {
      const playerOrder: PlayerColor[] = ['yellow', 'blue', 'red', 'green'];
      const otherColors = playerOrder.filter(c => c !== color);
      let captured = null;
      for (const other of otherColors) {
        const otherPos = gameState.pawns[other];
        if (typeof otherPos === 'number') {
          const otherCoord = paths[other][otherPos];
          if (otherCoord && otherCoord.row === row && otherCoord.col === col) {
            captured = other;
            break;
          }
        }
      }
      if (captured) {
        const captureMessage = gameState.isComputerGame 
          ? (captured === 'yellow' ? "Votre pion a été capturé et retourne à la maison !" : "Le pion de l'ordinateur a été capturé et retourne à la maison !") 
          : `Le pion ${captured} a été capturé et retourne à la maison !`;
        setGameState(prev => ({
          ...prev,
          pawns: { ...prev.pawns, [captured]: 'home' },
          message: captureMessage
        }));
      }
    }
  };

  // Fonction pour que l'ordinateur joue automatiquement
  const computerPlay = async (cellSize: number) => {
    if (!gameState.isComputerGame || !gameState.computerPlayers.includes(gameState.currentPlayer)) {
      return;
    }

    // Attendre un peu pour simuler la réflexion de l'ordinateur
    await wait(1000 + Math.random() * 1500);
    
    // L'ordinateur lance le dé automatiquement
    rollDice(cellSize);
  };

  // Fonction pour réinitialiser la partie
  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      diceValue: null,
      rolling: false,
      pawns: {
        yellow: 'home',
        blue: 'home',
        red: 'home',
        green: 'home',
      },
      doitDeplacer: false,
      message: null,
      isAnimating: false,
      finishedPlayers: [],
      gameFinished: false,
      currentPlayer: prev.activePlayers[0],
    }));
  };

  // Lancer de dé
  const rollDice = async (cellSize: number) => {
    if (gameState.doitDeplacer || gameState.isAnimating || gameState.gameFinished) return;
    
    setGameState(prev => ({ ...prev, rolling: true }));
    
    let rolls = 0;
    const maxRolls = 12;
    let finalValue = 1;
    
    const interval = setInterval(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      setGameState(prev => ({ ...prev, diceValue: value }));
      finalValue = value;
      rolls++;
      
      if (rolls >= maxRolls) {
        clearInterval(interval);
        setTimeout(async () => {
          setGameState(prev => ({ ...prev, rolling: false, diceValue: finalValue }));
          
          const pos = gameState.pawns[gameState.currentPlayer];
          const path = paths[gameState.currentPlayer];
          
          // Si le pion est à la maison et fait 6, il sort automatiquement
          if (pos === 'home' && finalValue === 6) {
            const playerName = gameState.isComputerGame 
              ? (gameState.currentPlayer === 'yellow' ? 'Votre' : "L'ordinateur") 
              : `Le joueur ${gameState.currentPlayer}`;
            setGameState(prev => ({
              ...prev,
              message: `${playerName} pion sort de la maison !`,
              pawns: { ...prev.pawns, [prev.currentPlayer]: 0 }
            }));
            await wait(200);
            handleCapture(gameState.currentPlayer, 0);
            setTimeout(() => {
              const message = gameState.isComputerGame 
                ? (gameState.currentPlayer === 'yellow' ? 'Vous avez fait 6, rejouez !' : "L'ordinateur a fait 6, il rejoue !") 
                : 'Tu as fait 6, rejoue !';
              setGameState(prev => ({ ...prev, message }));
              
              // Remettre diceValue à null après un délai pour permettre un nouveau lancer
              setTimeout(() => {
                setGameState(prev => ({ ...prev, diceValue: null, message: null }));
              }, 1500);
            }, 400);
          } else if (typeof pos === 'number') {
            const newPos = pos + finalValue;
            
            // Vérifie si le pion peut atteindre exactement la case centrale
            if (newPos === path.length - 1) {
              const newFinishedPlayers = [...gameState.finishedPlayers, gameState.currentPlayer];
              const position = newFinishedPlayers.length;
              const positionText = position === 1 ? '1er' : position === 2 ? '2ème' : position === 3 ? '3ème' : '4ème';
              
              const winnerName = gameState.isComputerGame 
                ? (gameState.currentPlayer === 'yellow' ? 'Vous' : "L'ordinateur") 
                : gameState.currentPlayer.toUpperCase();
              setGameState(prev => ({
                ...prev,
                finishedPlayers: newFinishedPlayers,
                message: `Bravo ! ${winnerName} termine ${positionText} !`
              }));
              
              await movePawnAnimated(gameState.currentPlayer, pos, newPos, cellSize);
              
              // Vérifie si le jeu est terminé
              if (newFinishedPlayers.length === gameState.activePlayers.length - 1) {
                setGameState(prev => ({ ...prev, gameFinished: true }));
                const lastPlayer = gameState.activePlayers.find(p => !newFinishedPlayers.includes(p));
                setTimeout(() => {
                  const ranking = newFinishedPlayers.map((p, i) => `${i + 1}. ${p.toUpperCase()}`).join(', ');
                  const finalRanking = lastPlayer ? `${ranking}, ${gameState.activePlayers.length}. ${lastPlayer.toUpperCase()}` : ranking;
                  setGameState(prev => ({ ...prev, message: `Jeu terminé ! Classement final : ${finalRanking}` }));
                }, 1000);
                return;
              }
              
              // Passe au joueur suivant
              setTimeout(() => {
                setGameState(prev => {
                  let nextPlayerIndex = (prev.activePlayers.indexOf(prev.currentPlayer) + 1) % prev.activePlayers.length;
                  while (newFinishedPlayers.includes(prev.activePlayers[nextPlayerIndex])) {
                    nextPlayerIndex = (nextPlayerIndex + 1) % prev.activePlayers.length;
                  }
                  return {
                    ...prev,
                    message: null,
                    diceValue: null,
                    currentPlayer: prev.activePlayers[nextPlayerIndex]
                  };
                });
              }, 2000);
              return;
            } else if (newPos < path.length - 1) {
              const moveMessage = gameState.isComputerGame 
                ? (gameState.currentPlayer === 'yellow' ? `Votre pion avance de ${finalValue} case(s) !` : `Le pion de l'ordinateur avance de ${finalValue} case(s) !`) 
                : `Le pion avance de ${finalValue} case(s) !`;
              setGameState(prev => ({ ...prev, message: moveMessage }));
              await movePawnAnimated(gameState.currentPlayer, pos, newPos, cellSize);
              handleCapture(gameState.currentPlayer, newPos);
              
              if (finalValue === 6) {
                setTimeout(() => {
                  const message = gameState.isComputerGame 
                    ? (gameState.currentPlayer === 'yellow' ? 'Vous avez fait 6, rejouez !' : "L'ordinateur a fait 6, il rejoue !") 
                    : 'Tu as fait 6, rejoue !';
                  setGameState(prev => ({ ...prev, message }));
                  
                  // Remettre diceValue à null après un délai pour permettre un nouveau lancer
                  setTimeout(() => {
                    setGameState(prev => ({ ...prev, diceValue: null, message: null }));
                  }, 1500);
                }, 400);
              } else {
                setTimeout(() => {
                  setGameState(prev => {
                    let nextPlayerIndex = (prev.activePlayers.indexOf(prev.currentPlayer) + 1) % prev.activePlayers.length;
                    while (prev.finishedPlayers.includes(prev.activePlayers[nextPlayerIndex])) {
                      nextPlayerIndex = (nextPlayerIndex + 1) % prev.activePlayers.length;
                    }
                    return {
                      ...prev,
                      message: null,
                      diceValue: null,
                      currentPlayer: prev.activePlayers[nextPlayerIndex]
                    };
                  });
                }, 800);
              }
            } else {
              setGameState(prev => ({ ...prev, message: 'Déplacement impossible (fin du chemin), tour suivant.' }));
              setTimeout(() => {
                setGameState(prev => {
                  let nextPlayerIndex = (prev.activePlayers.indexOf(prev.currentPlayer) + 1) % prev.activePlayers.length;
                  while (prev.finishedPlayers.includes(prev.activePlayers[nextPlayerIndex])) {
                    nextPlayerIndex = (nextPlayerIndex + 1) % prev.activePlayers.length;
                  }
                  return {
                    ...prev,
                    message: null,
                    diceValue: null,
                    currentPlayer: prev.activePlayers[nextPlayerIndex]
                  };
                });
              }, 1200);
            }
          } else {
            const homeMessage = gameState.isComputerGame 
              ? (gameState.currentPlayer === 'yellow' ? 'Vous devez faire 6 pour sortir de la maison.' : "L'ordinateur doit faire 6 pour sortir de la maison.") 
              : 'Vous devez faire 6 pour sortir de la maison.';
            setGameState(prev => ({ ...prev, message: homeMessage }));
            setTimeout(() => {
              setGameState(prev => {
                let nextPlayerIndex = (prev.activePlayers.indexOf(prev.currentPlayer) + 1) % prev.activePlayers.length;
                while (prev.finishedPlayers.includes(prev.activePlayers[nextPlayerIndex])) {
                  nextPlayerIndex = (nextPlayerIndex + 1) % prev.activePlayers.length;
                }
                return {
                  ...prev,
                  message: null,
                  diceValue: null,
                  currentPlayer: prev.activePlayers[nextPlayerIndex]
                };
              });
            }, 1200);
          }
        }, 200);
      }
    }, 60);
  };

  // Fonction pour synchroniser les positions animées
  const syncPawnPositions = (cellSize: number) => {
    (['yellow', 'blue', 'red', 'green'] as const).forEach(color => {
      const pos = gameState.pawns[color];
      const coords = getCellPosition(color, pos, cellSize);
      pawnAnim[color].setValue(coords || { x: 0, y: 0 });
    });
  };

  return {
    gameState,
    pawnAnim,
    paths,
    resetGame,
    rollDice,
    syncPawnPositions,
    getCellPosition,
    computerPlay,
  };
};

export default useGameLogic; 