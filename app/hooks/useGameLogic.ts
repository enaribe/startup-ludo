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
  showEventPopup: boolean;
  currentEventType: 'quiz' | 'financement' | 'duel' | 'evenement' | null;
  pendingEvent: { color: PlayerColor; eventType: 'quiz' | 'financement' | 'duel' | 'evenement' } | null;
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
    showEventPopup: false,
    currentEventType: null,
    pendingEvent: null,
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

  // Distribution des événements (même logique que dans GameBoard.tsx)
  const createEventDistribution = (): Record<string, 'quiz' | 'financement' | 'duel' | 'evenement'> => {
    const BOARD_SIZE = 15;
    
    // Cases de chemin valides (excluant départ, centre et chemins finaux) - même logique que GameBoard
    const pathCells: Array<{row: number, col: number}> = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        // Vérifier si c'est une case de chemin valide pour un événement
        if (
          ((row === 6 || row === 7 || row === 8) && (col >= 0 && col <= 14)) ||
          ((col === 6 || col === 7 || col === 8) && (row >= 0 && row <= 14))
        ) {
          // Exclure le centre
          if (row >= 6 && row <= 8 && col >= 6 && col <= 8) continue;
          
          // Exclure les cases de départ
          if ((row === 6 && col === 1) || (row === 1 && col === 8) || 
              (row === 13 && col === 6) || (row === 8 && col === 13)) continue;
              
          // Exclure les chemins finaux (cases colorées vers le centre)
          if ((row === 7 && col >= 1 && col <= 5) || 
              (col === 7 && row >= 1 && row <= 5) ||
              (row === 7 && col >= 9 && col <= 13) || 
              (col === 7 && row >= 9 && row <= 13)) continue;
              
          pathCells.push({row, col});
        }
      }
    }
    
    // Distribution fixe des événements selon les spécifications
    const eventDistribution: Record<string, 'quiz' | 'financement' | 'duel' | 'evenement'> = {};
    
    // Positions spécifiques pour les duels (4 cases stratégiques)
    const duelPositions = [
      {row: 6, col: 3}, {row: 3, col: 6}, {row: 11, col: 6}, {row: 6, col: 11}
    ];
    
    // Positions spécifiques pour les financements (8 cases bien réparties)
    const financementPositions = [
      {row: 6, col: 0}, {row: 6, col: 2}, {row: 0, col: 6}, {row: 2, col: 6},
      {row: 6, col: 12}, {row: 6, col: 14}, {row: 12, col: 6}, {row: 14, col: 6}
    ];
    
    // Assigner les duels
    duelPositions.forEach(pos => {
      if (pathCells.some(cell => cell.row === pos.row && cell.col === pos.col)) {
        eventDistribution[`${pos.row}-${pos.col}`] = 'duel';
      }
    });
    
    // Assigner les financements
    financementPositions.forEach(pos => {
      if (pathCells.some(cell => cell.row === pos.row && cell.col === pos.col)) {
        eventDistribution[`${pos.row}-${pos.col}`] = 'financement';
      }
    });
    
    // Assigner quiz et événements aux cases restantes
    pathCells.forEach((cell, index) => {
      const cellKey = `${cell.row}-${cell.col}`;
      if (!eventDistribution[cellKey]) {
        eventDistribution[cellKey] = index % 2 === 0 ? 'quiz' : 'evenement';
      }
    });
    
    console.log(`Distribution créée pour ${pathCells.length} cases du plateau`);
    return eventDistribution;
  };

  const eventDistribution = createEventDistribution();
  console.log('Distribution des événements:', eventDistribution);

  // Fonction pour vérifier et déclencher un événement
  const checkAndTriggerEvent = (color: PlayerColor, position: number, diceValue: number = 0) => {
    const { row, col } = paths[color][position];
    const cellKey = `${row}-${col}`;
    const eventType = eventDistribution[cellKey];
    
    console.log(`Vérification événement pour ${color} position ${position} (${row},${col}): ${eventType || 'aucun'}, dé: ${diceValue}`);
    console.log(`État actuel popup: visible=${gameState.showEventPopup}, type=${gameState.currentEventType}`);
    
    if (eventType) {
      // Si le joueur a fait 6, on met à jour/stocke l'événement en attente (écrase le précédent)
      if (diceValue === 6) {
        console.log(`Événement ${eventType} mis à jour en attente car le joueur a fait 6 et va rejouer`);
        setGameState(prev => ({
          ...prev,
          pendingEvent: { color, eventType } // Écrase l'événement précédent s'il y en avait un
        }));
        return;
      }
      
      console.log(`Déclenchement événement ${eventType} dans 700ms`);
      // Fermer d'abord tout popup existant, puis afficher le nouveau
      setGameState(prev => ({
        ...prev,
        showEventPopup: false,
        currentEventType: null,
        pendingEvent: null // Effacer tout événement en attente car on affiche celui-ci
      }));
      
      setTimeout(() => {
        console.log(`Affichage popup ${eventType} pour ${color}`);
        setGameState(prev => ({
          ...prev,
          showEventPopup: true,
          currentEventType: eventType
        }));
      }, 700); // Délai plus long pour s'assurer que l'animation est terminée
    } else if (diceValue === 6) {
      // Si pas d'événement sur cette case mais le joueur a fait 6, effacer l'événement en attente
      console.log(`Pas d'événement sur cette case, effacement de l'événement en attente`);
      setGameState(prev => ({
        ...prev,
        pendingEvent: null
      }));
    }
  };

  // Fonction pour déclencher un événement en attente
  const triggerPendingEvent = () => {
    if (gameState.pendingEvent) {
      console.log(`Déclenchement de l'événement en attente: ${gameState.pendingEvent.eventType} pour ${gameState.pendingEvent.color}`);
      
      setGameState(prev => ({
        ...prev,
        showEventPopup: false,
        currentEventType: null,
        pendingEvent: null
      }));
      
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          showEventPopup: true,
          currentEventType: gameState.pendingEvent!.eventType
        }));
      }, 700);
    }
  };

  // Fonction pour fermer le popup d'événement
  const closeEventPopup = () => {
    setGameState(prev => ({
      ...prev,
      showEventPopup: false,
      currentEventType: null
    }));
  };

  // Fonction utilitaire pour obtenir la position pixel d'une case
  const getCellPosition = (color: PlayerColor, pos: PawnPosition, cellSize: number) => {
    if (pos === 'home') {
      // Pour les pions à la maison, ils sont plus gros (cellSize * 2.0)
      const homeSize = cellSize * 2.0;
      const homeCenterOffset = (cellSize * 6 - homeSize) / 2;
      if (color === 'yellow') return { x: cellSize * 0 + homeCenterOffset, y: cellSize * 0 + homeCenterOffset };
      if (color === 'blue') return { x: cellSize * 9 + homeCenterOffset, y: cellSize * 0 + homeCenterOffset };
      if (color === 'red') return { x: cellSize * 9 + homeCenterOffset, y: cellSize * 9 + homeCenterOffset };
      if (color === 'green') return { x: cellSize * 0 + homeCenterOffset, y: cellSize * 9 + homeCenterOffset };
      return { x: 0, y: 0 };
    } else if (typeof pos === 'number' && paths[color][pos]) {
      const { row, col } = paths[color][pos];
      // Pour les pions sur le plateau, ils sont maintenant plus gros pour être mieux visibles (cellSize * 1.3)
      const pawnSize = cellSize * 1.3;
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
          duration: 150, // Réduit de 220 à 150ms pour une animation plus rapide
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }).start(() => resolve(true));
      });
      await wait(20); // Réduit de 30 à 20ms
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

    // Attendre un peu pour simuler la réflexion de l'ordinateur (réduit pour plus de rapidité)
    await wait(300 + Math.random() * 500); // Réduit de 1000-2500ms à 300-800ms
    
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
      showEventPopup: false,
      currentEventType: null,
      pendingEvent: null,
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
          // Capturer toutes les valeurs nécessaires au début pour éviter les problèmes de closure
          const currentPlayerAtThisTime = gameState.currentPlayer;
          const pos = gameState.pawns[currentPlayerAtThisTime];
          const path = paths[currentPlayerAtThisTime];
          
          setGameState(prev => ({ ...prev, rolling: false, diceValue: finalValue }));
          
          // Si le pion est à la maison et fait 6, il sort automatiquement
          if (pos === 'home' && finalValue === 6) {
            const playerName = gameState.isComputerGame 
              ? (currentPlayerAtThisTime === 'yellow' ? 'Votre' : "L'ordinateur") 
              : `Le joueur ${currentPlayerAtThisTime}`;
            
            // Mettre à jour l'état avec la nouvelle position
            setGameState(prev => ({
              ...prev,
              message: `${playerName} pion sort de la maison !`,
              pawns: { ...prev.pawns, [currentPlayerAtThisTime]: 0 }
            }));
            
            await wait(200);
            handleCapture(currentPlayerAtThisTime, 0);
            // Déclencher l'événement après avoir mis à jour l'état (avec la valeur du dé)
            checkAndTriggerEvent(currentPlayerAtThisTime, 0, finalValue);
            setTimeout(() => {
              const message = gameState.isComputerGame 
                ? (currentPlayerAtThisTime === 'yellow' ? 'Vous avez fait 6, rejouez !' : "L'ordinateur a fait 6, il rejoue !") 
                : 'Tu as fait 6, rejoue !';
              setGameState(prev => ({ ...prev, message }));
              
              // Remettre diceValue à null après un délai pour permettre un nouveau lancer
              setTimeout(() => {
                setGameState(prev => ({ ...prev, diceValue: null, message: null }));
              }, 800); // Réduit de 1500 à 800ms
            }, 200); // Réduit de 400 à 200ms
          } else if (typeof pos === 'number') {
            const newPos = pos + finalValue;
            
            // Vérifie si le pion peut atteindre exactement la case centrale
            if (newPos === path.length - 1) {
              const newFinishedPlayers = [...gameState.finishedPlayers, currentPlayerAtThisTime];
              const position = newFinishedPlayers.length;
              const positionText = position === 1 ? '1er' : position === 2 ? '2ème' : position === 3 ? '3ème' : '4ème';
              
              const winnerName = gameState.isComputerGame 
                ? (currentPlayerAtThisTime === 'yellow' ? 'Vous' : "L'ordinateur") 
                : currentPlayerAtThisTime.toUpperCase();
              setGameState(prev => ({
                ...prev,
                finishedPlayers: newFinishedPlayers,
                message: `Bravo ! ${winnerName} termine ${positionText} !`
              }));
              
              await movePawnAnimated(currentPlayerAtThisTime, pos, newPos, cellSize);
              
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
              }, 1000); // Réduit de 2000 à 1000ms
              return;
            } else if (newPos < path.length - 1) {
              const moveMessage = gameState.isComputerGame 
                ? (currentPlayerAtThisTime === 'yellow' ? `Votre pion avance de ${finalValue} case(s) !` : `Le pion de l'ordinateur avance de ${finalValue} case(s) !`) 
                : `Le pion avance de ${finalValue} case(s) !`;
              
              setGameState(prev => ({ ...prev, message: moveMessage }));
              await movePawnAnimated(currentPlayerAtThisTime, pos, newPos, cellSize);
              handleCapture(currentPlayerAtThisTime, newPos);
              // Déclencher l'événement après l'animation (avec la valeur du dé)
              checkAndTriggerEvent(currentPlayerAtThisTime, newPos, finalValue);
              
              if (finalValue === 6) {
                setTimeout(() => {
                  const message = gameState.isComputerGame 
                    ? (currentPlayerAtThisTime === 'yellow' ? 'Vous avez fait 6, rejouez !' : "L'ordinateur a fait 6, il rejoue !") 
                    : 'Tu as fait 6, rejoue !';
                  setGameState(prev => ({ ...prev, message }));
                  
                  // Remettre diceValue à null après un délai pour permettre un nouveau lancer
                  setTimeout(() => {
                    setGameState(prev => ({ ...prev, diceValue: null, message: null }));
                  }, 800); // Réduit de 1500 à 800ms
                }, 200); // Réduit de 400 à 200ms
              } else {
                // Le tour se termine (pas de 6), l'événement de la case actuelle a déjà été affiché par checkAndTriggerEvent
                // On efface l'événement en attente car on privilégie la dernière case
                setGameState(prev => ({ ...prev, pendingEvent: null }));
                
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
                }, 400); // Réduit de 800 à 400ms
              }
            } else {
              setGameState(prev => ({ ...prev, message: 'Déplacement impossible (fin du chemin), tour suivant.' }));
              // Le tour se termine, mais pas d'événement sur cette case, déclencher l'événement en attente s'il y en a un
              triggerPendingEvent();
              
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
              }, 600); // Réduit de 1200 à 600ms
            }
          } else {
            const homeMessage = gameState.isComputerGame 
              ? (currentPlayerAtThisTime === 'yellow' ? 'Vous devez faire 6 pour sortir de la maison.' : "L'ordinateur doit faire 6 pour sortir de la maison.") 
              : 'Vous devez faire 6 pour sortir de la maison.';
            setGameState(prev => ({ ...prev, message: homeMessage }));
            // Le tour se termine, mais le pion reste à la maison, déclencher l'événement en attente s'il y en a un
            triggerPendingEvent();
            
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
            }, 600); // Réduit de 1200 à 600ms
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
    closeEventPopup,
  };
};

export default useGameLogic; 