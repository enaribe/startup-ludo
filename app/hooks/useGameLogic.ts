import { useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

// Import des données du secteur santé
const santeData = require('../../data/sectors/sante-bien-etre.json');

export type PlayerColor = 'yellow' | 'blue' | 'red' | 'green';
export type PawnPosition = 'home' | number;

interface GameState {
  numberOfPlayers: 1 | 2 | 3 | 4;
  activePlayers: PlayerColor[];
  currentPlayer: PlayerColor;
  diceValue: number | null;
  rolling: boolean;
  pawns: Record<PlayerColor, PawnPosition>;
  tokens: Record<PlayerColor, number>; // Système de jetons (peut être négatif)
  doitDeplacer: boolean;
  message: string | null;
  isAnimating: boolean;
  finishedPlayers: PlayerColor[];
  gameFinished: boolean;
  isComputerGame: boolean;
  computerPlayers: PlayerColor[];
  showEventPopup: boolean;
  currentEventType: 'quiz' | 'financement' | 'duel' | 'opportunite' | 'challenge' | null;
  pendingEvent: { color: PlayerColor; eventType: 'quiz' | 'financement' | 'duel' | 'opportunite' | 'challenge' } | null;
  lastTokenChange: number;
  currentEventData: any; // Pour stocker les données de l'événement actuel
  pendingQuizTokens: number; // Jetons en attente pour le quiz
  eventPlayerColor: PlayerColor | null; // Le joueur concerné par l'événement en cours
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
      yellow: 'home', // Position 47, si dé = 3+, essaiera d'entrer dans chemin final
      blue: 'home',   // Position 48, si dé = 2+, essaiera d'entrer dans chemin final  
      red: 'home',    // Position 46, si dé = 4+, essaiera d'entrer dans chemin final
      green: 'home',  // Position 49, si dé = 1+, essaiera d'entrer dans chemin final
    },
    tokens: {
      yellow: 0,  // Pas assez de jetons (besoin de 7)
      blue: 0,    // Assez de jetons
      red: 0,     // Pas assez de jetons
      green: 0,   // Juste assez de jetons
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
    lastTokenChange: 0,
    currentEventData: null,
    pendingQuizTokens: 0,
    eventPlayerColor: null,
  });

  // Animations des pions
  const [pawnAnim] = useState({
    yellow: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    blue: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    red: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    green: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
  });

  // Chemins des pions - SEULEMENT le chemin de base (pas de boucle supplémentaire)
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
      // Chemin final vers le centre (positions 50-55)
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
      // Chemin final vers le centre (positions 50-55)
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
      // Chemin final vers le centre (positions 50-55)
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
      // Chemin final vers le centre (positions 50-55)
      { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 },
      { row: 10, col: 7 }, { row: 9, col: 7 }, { row: 8, col: 7 },
    ]
  };

  // Fonction utilitaire pour attendre un délai
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Fonction pour ajouter des jetons à un joueur
  const addTokens = (color: PlayerColor, amount: number) => {
    setGameState(prev => ({
      ...prev,
      tokens: {
        ...prev.tokens,
        [color]: prev.tokens[color] + amount
      }
    }));
  };

  // Distribution FIXE des événements sur le plateau
  const createEventDistribution = (): Record<string, 'quiz' | 'financement' | 'duel' | 'opportunite' | 'challenge'> => {
    // Distribution fixe et déterministe pour tous les jeux
    const fixedDistribution: Record<string, 'quiz' | 'financement' | 'duel' | 'opportunite' | 'challenge'> = {
      // Ligne horizontale du haut (row 6, de gauche à droite)
      '6-0': 'financement',
      // '6-1': PAS D'ÉVÉNEMENT - case de départ yellow
      '6-2': 'quiz',
      '6-3': 'opportunite', 
      '6-4': 'quiz',
      '6-5': 'challenge',
      '6-9': 'quiz',
      '6-10': 'duel',
      '6-11': 'quiz',
      '6-12': 'opportunite',
      '6-13': 'quiz',  // Nouvelle case avec événement
      '6-14': 'financement',
      
      // Ligne horizontale du bas (row 8, de droite à gauche)
      '8-14': 'quiz',
      // '8-13': PAS D'ÉVÉNEMENT - case de départ red
      '8-12': 'quiz',
      '8-11': 'opportunite',
      '8-10': 'quiz',
      '8-9': 'duel',
      '8-5': 'quiz',
      '8-4': 'challenge',
      '8-3': 'quiz',
      '8-2': 'opportunite',
      '8-1': 'quiz',
      '8-0': 'financement',
      
      // Ligne verticale de gauche (col 6, de haut en bas)
      '0-6': 'quiz',
      '1-6': 'challenge',
      '2-6': 'quiz',
      '3-6': 'duel',
      '4-6': 'quiz',
      '5-6': 'opportunite',
      '9-6': 'quiz',
      '10-6': 'challenge',
      '11-6': 'quiz',
      '12-6': 'opportunite',
      // '13-6': PAS D'ÉVÉNEMENT - case de départ green
      '14-6': 'financement',
      
      // Ligne verticale de droite (col 8, de bas en haut)
      '14-8': 'quiz',
      '13-8': 'opportunite',
      '12-8': 'quiz',
      '11-8': 'challenge',
      '10-8': 'quiz',
      '9-8': 'duel',
      '5-8': 'quiz',
      '4-8': 'opportunite',
      '3-8': 'quiz',
      '2-8': 'challenge',
      // '1-8': PAS D'ÉVÉNEMENT - case de départ blue
      '0-8': 'quiz',
      
      // Angles spéciaux
      '0-7': 'quiz',    // Entre les lignes verticales en haut
      '14-7': 'quiz',   // Entre les lignes verticales en bas  
      '7-0': 'quiz',    // Entre les lignes horizontales à gauche
      '7-14': 'quiz',   // Entre les lignes horizontales à droite
      
      // Cases de transition importantes
      '7-1': 'financement',  // Entrée chemin final yellow
      '1-7': 'financement',  // Entrée chemin final blue
      '7-13': 'financement', // Entrée chemin final red
      '13-7': 'financement', // Entrée chemin final green
    };
    
    console.log('Distribution FIXE créée avec répartition équilibrée');
    
    // Compter les types pour vérification
    const counts = { quiz: 0, financement: 0, duel: 0, opportunite: 0, challenge: 0 };
    Object.values(fixedDistribution).forEach(type => counts[type]++);
    console.log('Répartition des événements:', counts);
    
    return fixedDistribution;
  };

  const eventDistribution = createEventDistribution();
  // console.log('Distribution des événements:', eventDistribution);

  // Fonction pour vérifier si un joueur peut entrer dans le chemin final
  const canEnterFinalPath = (color: PlayerColor): boolean => {
    return gameState.tokens[color] >= 7;
  };

  // Positions où chaque joueur peut entrer dans son chemin final
  const finalPathEntryPositions = {
    yellow: 100, // Position 100 = { row: 7, col: 1 } (première case du chemin final)
    blue: 100,   // Position 100 = { row: 1, col: 7 } (première case du chemin final)
    red: 100,    // Position 100 = { row: 7, col: 13 } (première case du chemin final)
    green: 100   // Position 100 = { row: 13, col: 7 } (première case du chemin final)
  };

  // Fonction pour calculer la position réelle avec la logique de boucle
  const calculateRealPosition = (color: PlayerColor, targetPosition: number): number => {
    const path = paths[color];
    const MAIN_PATH_LENGTH = 50; // Positions 0-49 pour le tour principal
    
    // Si la position est dans le chemin de base normal
    if (targetPosition < path.length) {
      return targetPosition;
    }
    
    // Si le pion dépasse, calculer la position en boucle dans le chemin principal
    const overflow = targetPosition - MAIN_PATH_LENGTH;
    const cyclicPosition = overflow % MAIN_PATH_LENGTH;
    return cyclicPosition;
  };

  // Fonction pour calculer la position quand le joueur ne peut pas entrer dans le chemin final
  const calculateLoopPosition = (color: PlayerColor, currentPos: number, diceValue: number): number => {
    const MAIN_PATH_LENGTH = 50; // Le chemin principal fait 50 cases (0-49)
    
    // Si le joueur est déjà dans le chemin final (position >= 50) et ne peut pas continuer,
    // il doit retourner au chemin principal
    if (currentPos >= 50) {
      // Calculer combien de cases il voudrait avancer dans le chemin final
      const finalPathSteps = diceValue;
      // Le retourner au début du chemin principal avec le nombre de cases correspondant
      return finalPathSteps - 1; // -1 car on commence à 0
    }
    
    // Si on est dans le chemin principal et qu'on dépasse la position 49,
    // on continue la boucle dans le chemin principal
    const wouldBePosition = currentPos + diceValue;
    
    if (wouldBePosition >= MAIN_PATH_LENGTH) {
      // On dépasse la fin du chemin principal, on fait une boucle
      const overflow = wouldBePosition - MAIN_PATH_LENGTH;
      return overflow; // 0, 1, 2, 3, etc.
    }
    
    return wouldBePosition; // Position normale
  };

  // Fonction pour déterminer si une position mène au chemin final RESTRICTIF
  const wouldEnterFinalPath = (currentPos: number, diceValue: number): boolean => {
    const targetPos = currentPos + diceValue;
    // La position 50 est accessible à tous (première case du chemin final)
    // Seules les positions 51+ nécessitent des jetons
    // Donc on vérifie si on va de < 51 vers >= 51
    return currentPos < 51 && targetPos >= 51;
  };

  // Fonction pour sélectionner un élément aléatoire dans les données JSON
  const getRandomEventData = (eventType: 'quiz' | 'financement' | 'duel' | 'opportunite' | 'challenge') => {
    try {
      let dataArray: any[] = [];
      
      switch (eventType) {
        case 'quiz':
          dataArray = santeData.quiz || [];
          break;
        case 'financement':
          dataArray = santeData.financement || [];
          break;
        case 'duel':
          dataArray = santeData.duel || [];
          break;
        case 'opportunite':
          dataArray = santeData.opportunites || [];
          break;
        case 'challenge':
          dataArray = santeData.challenges || [];
          break;
      }
      
      if (dataArray.length === 0) {
        console.warn(`Aucune donnée trouvée pour ${eventType}`);
        return null;
      }
      
      // Sélectionner un élément aléatoire
      const randomIndex = Math.floor(Math.random() * dataArray.length);
      return dataArray[randomIndex];
    } catch (error) {
      console.error(`Erreur lors de la récupération des données pour ${eventType}:`, error);
      return null;
    }
  };

  // Fonction pour vérifier et déclencher un événement
  const checkAndTriggerEvent = (color: PlayerColor, position: number, diceValue: number = 0) => {
    const { row, col } = paths[color][position];
    const cellKey = `${row}-${col}`;
    const eventType = eventDistribution[cellKey];
    
    console.log(`Vérification événement pour ${color} position ${position} (${row},${col}): ${eventType || 'aucun'}, dé: ${diceValue}`);
    console.log(`État actuel popup: visible=${gameState.showEventPopup}, type=${gameState.currentEventType}`);
    
    if (eventType) {
      // Récupérer les vraies données depuis le JSON
      const eventData = getRandomEventData(eventType);
      console.log(`Données événement sélectionnées:`, eventData);
      
      // Si le joueur a fait 6, TOUJOURS stocker l'événement en attente (peu importe le type)
      if (diceValue === 6) {
        console.log(`Événement ${eventType} mis en attente car le joueur a fait 6 et va rejouer`);
        setGameState(prev => ({
          ...prev,
          pendingEvent: { color, eventType },
          currentEventData: eventData
        }));
        return; // Ne pas déclencher l'événement maintenant
      }
      
      // Si ce n'est pas un 6, déclencher l'événement normalement
      // Calculer les jetons selon les données réelles ou système par défaut
      let tokensChange = 0;
      
      if (eventData && eventData.tokens) {
        tokensChange = eventData.tokens;
      } else if (eventData && eventData.rewards) {
        // Pour les duels qui ont une structure rewards
        tokensChange = eventData.rewards.success || 0;
      } else {
        const randomOutcome = Math.random();
        
        switch (eventType) {
          case 'quiz':
            tokensChange = randomOutcome < 0.6 ? 1 : (randomOutcome < 0.8 ? 0 : -1);
            break;
          case 'financement':
            tokensChange = randomOutcome < 0.7 ? 2 : (randomOutcome < 0.85 ? 1 : -1);
            break;
          case 'duel':
            tokensChange = randomOutcome < 0.5 ? 2 : (randomOutcome < 0.7 ? 0 : -2);
            break;
          case 'opportunite':
            tokensChange = randomOutcome < 0.4 ? 1 : (randomOutcome < 0.7 ? 0 : -1);
            break;
          case 'challenge':
            tokensChange = randomOutcome < 0.2 ? 0 : (randomOutcome < 0.6 ? -1 : -2);
            break;
        }
      }
      
      // Pour les quiz, on stocke les jetons en attente et laisse le joueur répondre
      if (eventType === 'quiz') {
        const potentialTokens = Math.abs(tokensChange) || 1;
        
        setGameState(prev => ({
          ...prev,
          pendingQuizTokens: potentialTokens,
          lastTokenChange: 0,
          currentEventData: eventData,
          eventPlayerColor: color
        }));
      } else {
        // Pour les autres événements, appliquer directement les jetons
        if (tokensChange !== 0) {
          setGameState(prev => ({
            ...prev,
            tokens: {
              ...prev.tokens,
              [color]: prev.tokens[color] + tokensChange
            }
          }));
        }
        
        setGameState(prev => ({
          ...prev,
          lastTokenChange: tokensChange,
          currentEventData: eventData,
          eventPlayerColor: color
        }));
      }
      
      // Déclencher l'événement immédiatement (car ce n'est pas un 6)
      console.log(`Déclenchement événement ${eventType} dans 700ms`);
      setGameState(prev => ({
        ...prev,
        showEventPopup: false,
        currentEventType: null,
        pendingEvent: null
      }));
      
      setTimeout(() => {
        console.log(`Affichage popup ${eventType} pour ${color}`);
        setGameState(prev => ({
          ...prev,
          showEventPopup: true,
          currentEventType: eventType
        }));
      }, 700);
    } else if (diceValue === 6) {
      // Si pas d'événement sur cette case mais le joueur a fait 6, ne rien faire
      console.log(`Pas d'événement sur cette case, le joueur va rejouer`);
    }
  };

  // Fonction pour déclencher un événement en attente
  const triggerPendingEvent = () => {
    if (gameState.pendingEvent && gameState.currentEventData) {
      const { color, eventType } = gameState.pendingEvent;
      const eventData = gameState.currentEventData;
      
      console.log(`Déclenchement de l'événement en attente: ${eventType} pour ${color}`);
      
      // Calculer les jetons selon les données réelles ou système par défaut
      let tokensChange = 0;
      
      if (eventData && eventData.tokens) {
        tokensChange = eventData.tokens;
      } else if (eventData && eventData.rewards) {
        // Pour les duels qui ont une structure rewards
        tokensChange = eventData.rewards.success || 0;
      } else {
        const randomOutcome = Math.random();
        
        switch (eventType) {
          case 'quiz':
            tokensChange = randomOutcome < 0.6 ? 1 : (randomOutcome < 0.8 ? 0 : -1);
            break;
          case 'financement':
            tokensChange = randomOutcome < 0.7 ? 2 : (randomOutcome < 0.85 ? 1 : -1);
            break;
          case 'duel':
            tokensChange = randomOutcome < 0.5 ? 2 : (randomOutcome < 0.7 ? 0 : -2);
            break;
          case 'opportunite':
            tokensChange = randomOutcome < 0.4 ? 1 : (randomOutcome < 0.7 ? 0 : -1);
            break;
          case 'challenge':
            tokensChange = randomOutcome < 0.2 ? 0 : (randomOutcome < 0.6 ? -1 : -2);
            break;
        }
      }
      
      // Pour les quiz, on stocke les jetons en attente et laisse le joueur répondre
      if (eventType === 'quiz') {
        const potentialTokens = Math.abs(tokensChange) || 1;
        
        setGameState(prev => ({
          ...prev,
          pendingQuizTokens: potentialTokens,
          lastTokenChange: 0,
          showEventPopup: false,
          currentEventType: null,
          pendingEvent: null,
          eventPlayerColor: color
        }));
      } else {
        // Pour les autres événements, appliquer directement les jetons
        if (tokensChange !== 0) {
          setGameState(prev => ({
            ...prev,
            tokens: {
              ...prev.tokens,
              [color]: prev.tokens[color] + tokensChange
            }
          }));
        }
        
        setGameState(prev => ({
          ...prev,
          lastTokenChange: tokensChange,
          showEventPopup: false,
          currentEventType: null,
          pendingEvent: null,
          eventPlayerColor: color
        }));
      }
      
      // Déclencher l'affichage du popup
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          showEventPopup: true,
          currentEventType: eventType
        }));
      }, 700);
    }
  };

  // Fonction pour gérer les réponses de quiz
  const handleQuizAnswer = (selectedIndex: number) => {
    const isCorrect = gameState.currentEventData && gameState.currentEventData.correctAnswer === selectedIndex;
    const tokensToChange = isCorrect ? gameState.pendingQuizTokens : -gameState.pendingQuizTokens;
    const targetPlayer = gameState.eventPlayerColor || gameState.currentPlayer; // Fallback sur currentPlayer
    
    // Appliquer le changement de jetons au bon joueur
    setGameState(prev => ({
      ...prev,
      tokens: {
        ...prev.tokens,
        [targetPlayer]: prev.tokens[targetPlayer] + tokensToChange
      },
      lastTokenChange: tokensToChange,
      pendingQuizTokens: 0,
      eventPlayerColor: null
    }));
    
    console.log(`Quiz ${isCorrect ? 'correct' : 'incorrect'}: ${tokensToChange} jetons pour ${targetPlayer}`);
  };

  // Fonction pour fermer le popup d'événement
  const closeEventPopup = () => {
    setGameState(prev => ({
      ...prev,
      showEventPopup: false,
      currentEventType: null,
      pendingQuizTokens: 0,
      eventPlayerColor: null
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
    } else if (typeof pos === 'number') {
      // Utiliser la position réelle calculée pour les positions au-delà du chemin principal
      const realPos = pos >= paths[color].length ? calculateRealPosition(color, pos) : pos;
      
      if (paths[color][realPos]) {
        const { row, col } = paths[color][realPos];
        // Pour les pions sur le plateau, ils sont maintenant plus gros pour être mieux visibles (cellSize * 1.3)
        const pawnSize = cellSize * 1.3;
        const centerOffset = (cellSize - pawnSize) / 2;
        return { x: col * cellSize + centerOffset, y: row * cellSize + centerOffset };
      }
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
        yellow: 'home', // Position 47, si dé = 3+, essaiera d'entrer dans chemin final
        blue: 'home',   // Position 48, si dé = 2+, essaiera d'entrer dans chemin final  
        red: 'home',    // Position 46, si dé = 4+, essaiera d'entrer dans chemin final
        green: 'home',  // Position 49, si dé = 1+, essaiera d'entrer dans chemin final
      },
      tokens: {
        yellow: 0,  // Pas assez de jetons (besoin de 7)
        blue: 0,    // Assez de jetons
        red: 0,     // Pas assez de jetons
        green: 0,   // Juste assez de jetons
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
      lastTokenChange: 0,
      currentEventData: null,
      pendingQuizTokens: 0,
      eventPlayerColor: null,
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
              }, 800);
            }, 200); // Réduit de 400 à 200ms
          } else if (typeof pos === 'number') {
            const newPos = pos + finalValue;
            
            // NOUVELLE VÉRIFICATION : Si le pion est déjà dans le chemin final (positions 50-55)
            if (pos >= 50) {
              console.log(`DEBUG: ${currentPlayerAtThisTime} est déjà dans le chemin final (position ${pos})`);
              
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
                }, 1000);
                return;
              }
              // Si le pion peut avancer dans le chemin final sans dépasser
              else if (newPos < path.length - 1) {
                // VÉRIFICATION DES JETONS même pour les pions déjà dans le chemin final
                const currentTokens = gameState.tokens[currentPlayerAtThisTime];
                const hasEnoughTokens = currentTokens >= 7;
                
                console.log(`DEBUG: Pion ${currentPlayerAtThisTime} dans le chemin final veut avancer de ${pos} vers ${newPos}`);
                console.log(`DEBUG: Jetons actuels: ${currentTokens}, Besoin: 7, Peut continuer: ${hasEnoughTokens}`);
                
                if (hasEnoughTokens) {
                  // Il a assez de jetons, il peut continuer dans le chemin final
                  const moveMessage = gameState.isComputerGame 
                    ? (currentPlayerAtThisTime === 'yellow' ? `Votre pion avance dans le chemin final !` : `Le pion de l'ordinateur avance dans le chemin final !`) 
                    : `Le pion avance dans le chemin final !`;
                  
                  console.log(`DEBUG: Avancement autorisé dans le chemin final de ${pos} vers ${newPos}`);
                  setGameState(prev => ({ ...prev, message: moveMessage }));
                  await movePawnAnimated(currentPlayerAtThisTime, pos, newPos, cellSize);
                  // Pas de capture possible dans le chemin final
                  // Pas d'événement dans le chemin final
                } else {
                  // Il n'a pas assez de jetons, il doit retourner au chemin principal
                  const tokensNeeded = 7 - currentTokens;
                  const loopPosition = calculateLoopPosition(currentPlayerAtThisTime, pos, finalValue);
                  
                  console.log(`DEBUG: Continuation refusée, retour au chemin principal. Position calculée: ${loopPosition}`);
                  
                  const tokenMessage = gameState.isComputerGame 
                    ? `Vous avez besoin de ${tokensNeeded} jeton(s) de plus pour progresser dans le chemin final ! Retour au plateau.`
                    : `Vous avez besoin de ${tokensNeeded} jeton(s) de plus pour progresser dans le chemin final ! Retour au plateau.`;
                  
                  setGameState(prev => ({ ...prev, message: tokenMessage }));
                  await movePawnAnimated(currentPlayerAtThisTime, pos, loopPosition, cellSize);
                  handleCapture(currentPlayerAtThisTime, loopPosition);
                  checkAndTriggerEvent(currentPlayerAtThisTime, loopPosition, finalValue);
                }
              }
              // Si le mouvement dépasserait la fin du chemin final, le pion reste sur place
              else {
                const stayMessage = gameState.isComputerGame 
                  ? (currentPlayerAtThisTime === 'yellow' ? `Vous ne pouvez pas avancer, le dé est trop élevé !` : `L'ordinateur ne peut pas avancer, le dé est trop élevé !`) 
                  : `Mouvement impossible, le dé est trop élevé !`;
                
                console.log(`DEBUG: Mouvement impossible dans le chemin final, pion reste en position ${pos}`);
                setGameState(prev => ({ ...prev, message: stayMessage }));
                // Le pion reste à sa position actuelle, pas d'animation
              }
            }
            // Vérifie si le pion peut atteindre exactement la case centrale (pour les pions pas encore dans le chemin final)
            else if (newPos === path.length - 1) {
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
              }, 1000);
              return;
            }
            // Nouvelle logique intelligente de déplacement
            else if (wouldEnterFinalPath(pos, finalValue)) {
              // Le joueur essaie d'entrer dans le chemin final
              // Capturer les valeurs actuelles pour éviter les problèmes de closure
              const currentTokens = gameState.tokens[currentPlayerAtThisTime];
              const hasEnoughTokens = currentTokens >= 7;
              
              console.log(`DEBUG: ${currentPlayerAtThisTime} essaie d'entrer dans le chemin final`);
              console.log(`DEBUG: Position actuelle: ${pos}, Dé: ${finalValue}, Nouvelle position: ${newPos}`);
              console.log(`DEBUG: Jetons actuels: ${currentTokens}, Besoin: 7, Peut entrer: ${hasEnoughTokens}`);
              
              if (hasEnoughTokens) {
                // Il a assez de jetons, il peut entrer
                const moveMessage = gameState.isComputerGame 
                  ? (currentPlayerAtThisTime === 'yellow' ? `Votre pion entre dans le chemin final !` : `Le pion de l'ordinateur entre dans le chemin final !`) 
                  : `Le pion entre dans le chemin final !`;
                
                console.log(`DEBUG: Entrée autorisée dans le chemin final`);
                setGameState(prev => ({ ...prev, message: moveMessage }));
                await movePawnAnimated(currentPlayerAtThisTime, pos, newPos, cellSize);
                handleCapture(currentPlayerAtThisTime, newPos);
                checkAndTriggerEvent(currentPlayerAtThisTime, newPos, finalValue);
              } else {
                // Il n'a pas assez de jetons, on utilise la boucle supplémentaire
                const tokensNeeded = 7 - currentTokens;
                const loopPosition = calculateLoopPosition(currentPlayerAtThisTime, pos, finalValue);
                
                console.log(`DEBUG: Entrée refusée, utilisation de la boucle. Position calculée: ${loopPosition}`);
                
                const tokenMessage = gameState.isComputerGame 
                  ? `Vous avez besoin de ${tokensNeeded} jeton(s) de plus pour entrer dans le chemin final ! Continuez le tour du plateau.`
                  : `Vous avez besoin de ${tokensNeeded} jeton(s) de plus pour entrer dans le chemin final ! Continuez le tour du plateau.`;
                
                setGameState(prev => ({ ...prev, message: tokenMessage }));
                await movePawnAnimated(currentPlayerAtThisTime, pos, loopPosition, cellSize);
                handleCapture(currentPlayerAtThisTime, loopPosition);
                checkAndTriggerEvent(currentPlayerAtThisTime, loopPosition, finalValue);
              }
            } else if (newPos < path.length - 1) {
              // Déplacement normal sur le plateau
              const moveMessage = gameState.isComputerGame 
                ? (currentPlayerAtThisTime === 'yellow' ? `Votre pion avance de ${finalValue} case(s) !` : `Le pion de l'ordinateur avance de ${finalValue} case(s) !`) 
                : `Le pion avance de ${finalValue} case(s) !`;
              
              setGameState(prev => ({ ...prev, message: moveMessage }));
              await movePawnAnimated(currentPlayerAtThisTime, pos, newPos, cellSize);
              handleCapture(currentPlayerAtThisTime, newPos);
              checkAndTriggerEvent(currentPlayerAtThisTime, newPos, finalValue);
            } else {
              // Déplacement impossible ou utilisation de la boucle
              const realPosition = calculateRealPosition(currentPlayerAtThisTime, newPos);
              
              if (realPosition !== newPos) {
                // On utilise la boucle supplémentaire
                const moveMessage = gameState.isComputerGame 
                  ? (currentPlayerAtThisTime === 'yellow' ? `Votre pion continue le tour du plateau !` : `Le pion de l'ordinateur continue le tour du plateau !`) 
                  : `Le pion continue le tour du plateau !`;
                
                setGameState(prev => ({ ...prev, message: moveMessage }));
                await movePawnAnimated(currentPlayerAtThisTime, pos, realPosition, cellSize);
                handleCapture(currentPlayerAtThisTime, realPosition);
                checkAndTriggerEvent(currentPlayerAtThisTime, realPosition, finalValue);
              } else {
                setGameState(prev => ({ ...prev, message: 'Déplacement impossible (fin du chemin), tour suivant.' }));
                triggerPendingEvent();
              }
            }
            
            // Gestion des tours suivants
            if (finalValue === 6) {
              setTimeout(() => {
                const message = gameState.isComputerGame 
                  ? (currentPlayerAtThisTime === 'yellow' ? 'Vous avez fait 6, rejouez !' : "L'ordinateur a fait 6, il rejoue !") 
                  : 'Tu as fait 6, rejoue !';
                setGameState(prev => ({ ...prev, message }));
                
                setTimeout(() => {
                  setGameState(prev => ({ ...prev, diceValue: null, message: null }));
                }, 800);
              }, 200);
            } else {
              // Le joueur n'a pas fait 6, déclencher l'événement en attente s'il y en a un
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
              }, 400);
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
    handleQuizAnswer,
  };
};

export default useGameLogic; 