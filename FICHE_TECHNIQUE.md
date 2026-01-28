# 🎮 FICHE TECHNIQUE - STARTUP LUDO
## Document de Référence Détaillé pour Claude Code

> ⚠️ **Ce document est une RÉFÉRENCE.** Lis d'abord **PROMPT_CLAUDE_CODE.md** pour tes instructions.

---

## 📋 CONTEXTE DU PROJET

Tu es un expert en développement mobile React Native. Tu dois générer le projet complet **"Startup Ludo"** - un jeu de plateau mobile éducatif sur l'entrepreneuriat inspiré du jeu de Ludo (Petits Chevaux).

Le document de spécifications fonctionnelles complet est fourni séparément. Cette fiche technique définit l'architecture, les technologies et les bonnes pratiques à suivre.

---

## 🎯 OBJECTIFS TECHNIQUES

1. **Performance** : Application fluide à 60 FPS, même sur appareils anciens
2. **Optimisation Firebase** : Utilisation économe et performante, surtout pour le multijoueur
3. **Code maintenable** : Architecture scalable, typée, testable
4. **Expérience utilisateur** : Animations fluides, transitions natives, temps de chargement minimal

---

## 🛠️ STACK TECHNIQUE 2026

### Core Framework
```json
{
  "expo": "~55.0.0",
  "react-native": "0.83.x",
  "react": "19.2.x",
  "typescript": "5.7.x"
}
```

### Justification des versions
- **Expo SDK 55** : Dernière version stable (janvier 2026), support exclusif New Architecture
- **React Native 0.83** : New Architecture obligatoire, performances optimisées avec Fabric et TurboModules
- **React 19.2** : Support complet des owner stacks, `useDeferredValue` et `startTransition` optimisés
- **Hermes v1** : Nouveau moteur JS avec performances améliorées (opt-in dans SDK 55)

### Dépendances Principales

```json
{
  "dependencies": {
    // Navigation - File-based routing
    "expo-router": "~4.0.0",
    
    // State Management - Léger et performant
    "zustand": "^5.0.0",
    
    // Animations - Native thread
    "react-native-reanimated": "^4.0.0",
    "react-native-gesture-handler": "^2.20.0",
    "lottie-react-native": "^7.0.0",
    
    // Listes performantes
    "@shopify/flash-list": "^2.0.0",
    
    // Firebase
    "@react-native-firebase/app": "^21.0.0",
    "@react-native-firebase/auth": "^21.0.0",
    "@react-native-firebase/firestore": "^21.0.0",
    "@react-native-firebase/database": "^21.0.0",
    "@react-native-firebase/storage": "^21.0.0",
    "@react-native-firebase/functions": "^21.0.0",
    "@react-native-firebase/app-check": "^21.0.0",
    
    // UI & Styling
    "nativewind": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "expo-linear-gradient": "~14.0.0",
    
    // Audio
    "expo-audio": "~1.0.0",
    
    // Fonts
    "expo-font": "~13.0.0",
    "@expo-google-fonts/luckiest-guy": "*",
    "@expo-google-fonts/open-sans": "*",
    "@expo-google-fonts/space-mono": "*",
    
    // Utilitaires
    "expo-haptics": "~14.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-splash-screen": "~0.29.0",
    "react-native-safe-area-context": "^5.0.0",
    "react-native-svg": "^15.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.7.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0",
    "jest": "^29.0.0",
    "@testing-library/react-native": "^13.0.0"
  }
}
```

---

## 📁 ARCHITECTURE DU PROJET

```
startup-ludo/
├── src/
│   ├── app/                          # Expo Router (file-based routing)
│   │   ├── _layout.tsx               # Root layout
│   │   ├── index.tsx                 # Écran d'accueil
│   │   ├── (auth)/                   # Groupe authentification
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (tabs)/                   # Navigation principale (tabs)
│   │   │   ├── _layout.tsx
│   │   │   ├── home.tsx
│   │   │   ├── portfolio.tsx
│   │   │   ├── classement.tsx
│   │   │   └── profil.tsx
│   │   ├── (game)/                   # Groupe jeu
│   │   │   ├── _layout.tsx
│   │   │   ├── mode-selection.tsx
│   │   │   ├── local-setup.tsx
│   │   │   ├── online-setup.tsx
│   │   │   ├── lobby/[roomId].tsx
│   │   │   ├── play/[gameId].tsx
│   │   │   └── results/[gameId].tsx
│   │   ├── (startup)/                # Création startup
│   │   │   ├── _layout.tsx
│   │   │   ├── inspiration-cards.tsx
│   │   │   ├── creation.tsx
│   │   │   └── confirmation.tsx
│   │   └── settings.tsx
│   │
│   ├── components/                   # Composants réutilisables
│   │   ├── ui/                       # Composants UI de base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── game/                     # Composants spécifiques au jeu
│   │   │   ├── GameBoard/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── BoardCell.tsx
│   │   │   │   ├── Pawn.tsx
│   │   │   │   ├── CenterZone.tsx
│   │   │   │   └── useGameBoard.ts
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── Dice.tsx
│   │   │   ├── EmojiChat.tsx
│   │   │   └── GameHeader.tsx
│   │   ├── popups/                   # Popups d'événements
│   │   │   ├── QuizPopup.tsx
│   │   │   ├── DuelPopup.tsx
│   │   │   ├── FundingPopup.tsx
│   │   │   ├── EventPopup.tsx
│   │   │   └── VictoryPopup.tsx
│   │   └── common/                   # Composants communs
│   │       ├── LoadingScreen.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── useAuthStore.ts
│   │   ├── useGameStore.ts
│   │   ├── useUserStore.ts
│   │   └── useSettingsStore.ts
│   │
│   ├── services/                     # Services Firebase
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   ├── firestore.ts
│   │   │   ├── realtime.ts
│   │   │   └── storage.ts
│   │   ├── game/
│   │   │   ├── GameEngine.ts
│   │   │   ├── AIPlayer.ts
│   │   │   ├── MultiplayerSync.ts
│   │   │   └── EventManager.ts
│   │   └── api/
│   │       └── cloudFunctions.ts
│   │
│   ├── hooks/                        # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useGame.ts
│   │   ├── useFirestoreSubscription.ts
│   │   ├── useRealtimeSync.ts
│   │   ├── useSound.ts
│   │   └── useHaptics.ts
│   │
│   ├── utils/                        # Utilitaires
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   └── animations.ts
│   │
│   ├── types/                        # Types TypeScript
│   │   ├── game.types.ts
│   │   ├── user.types.ts
│   │   ├── firebase.types.ts
│   │   └── navigation.types.ts
│   │
│   ├── data/                         # Données statiques du jeu
│   │   ├── editions/
│   │   │   ├── classic.json
│   │   │   ├── agriculture.json
│   │   │   ├── education.json
│   │   │   ├── sante.json
│   │   │   ├── tourisme.json
│   │   │   └── culture.json
│   │   └── board-layout.json
│   │
│   ├── i18n/                         # Internationalisation
│   │   ├── config.ts
│   │   ├── fr/
│   │   └── en/
│   │
│   └── styles/                       # Styles globaux
│       ├── theme.ts
│       ├── colors.ts
│       └── typography.ts
│
├── assets/
│   ├── fonts/
│   ├── images/
│   ├── sounds/
│   └── animations/                   # Fichiers Lottie
│
├── functions/                        # Cloud Functions Firebase
│   ├── src/
│   │   ├── index.ts
│   │   ├── game/
│   │   │   ├── createRoom.ts
│   │   │   ├── joinRoom.ts
│   │   │   └── processGameAction.ts
│   │   └── user/
│   │       ├── onUserCreate.ts
│   │       └── updateStats.ts
│   └── package.json
│
├── app.json
├── tsconfig.json
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
└── firestore.rules
```

---

## ⚡ OPTIMISATIONS PERFORMANCE

### 1. Configuration New Architecture

```typescript
// app.json
{
  "expo": {
    "newArchEnabled": true, // Obligatoire SDK 55
    "plugins": [
      ["expo-build-properties", {
        "ios": {
          "useFrameworks": "static"
        },
        "android": {
          "compileSdkVersion": 35,
          "targetSdkVersion": 35,
          "buildToolsVersion": "35.0.0"
        }
      }]
    ]
  }
}
```

### 2. Animations Performantes avec Reanimated 4

```typescript
// components/game/Pawn.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing
} from 'react-native-reanimated';

interface PawnProps {
  color: string;
  position: { x: number; y: number };
  onMoveComplete?: () => void;
}

export const Pawn: React.FC<PawnProps> = ({ color, position, onMoveComplete }) => {
  const translateX = useSharedValue(position.x);
  const translateY = useSharedValue(position.y);
  const scale = useSharedValue(1);

  // Animation sur le thread UI natif
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  const moveTo = useCallback((newX: number, newY: number) => {
    'worklet';
    scale.value = withSpring(1.2);
    translateX.value = withTiming(newX, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    translateY.value = withTiming(newY, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    }, (finished) => {
      if (finished) {
        scale.value = withSpring(1);
        if (onMoveComplete) runOnJS(onMoveComplete)();
      }
    });
  }, []);

  return (
    <Animated.View style={[styles.pawn, { backgroundColor: color }, animatedStyle]} />
  );
};
```

### 3. Listes Optimisées avec FlashList v2

```typescript
// FlashList v2 - Plus besoin d'estimatedItemSize !
import { FlashList } from '@shopify/flash-list';

export const LeaderboardList: React.FC = () => {
  const renderItem = useCallback(({ item }: { item: Player }) => (
    <LeaderboardItem player={item} />
  ), []);

  return (
    <FlashList
      data={players}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      // FlashList v2 calcule automatiquement les layouts
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
    />
  );
};
```

### 4. Mémoisation avec React Compiler (SDK 55+)

```typescript
// Le React Compiler optimise automatiquement
// Mais pour les cas critiques, mémoisation manuelle :

// ✅ Composants purs pour le plateau de jeu
export const BoardCell = memo(({ type, index, onPress }: BoardCellProps) => {
  return (
    <Pressable onPress={() => onPress(index)} style={styles.cell}>
      <CellIcon type={type} />
    </Pressable>
  );
});

// ✅ Callbacks stables pour éviter re-renders
const handleDiceRoll = useCallback(() => {
  gameStore.rollDice();
}, []);
```

---

## 🔥 ARCHITECTURE FIREBASE OPTIMISÉE

### Stratégie Hybride : Firestore + Realtime Database

**Principe clé** : Utiliser Firestore pour les données persistantes et Realtime Database pour la synchronisation temps réel du jeu (économie de coûts).

```
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FIRESTORE (Données persistantes - facturé par opération)  │
│  ├── users/{userId}                                        │
│  │   ├── profile, stats, achievements                      │
│  │   └── portfolio/startups                                │
│  ├── leaderboard/                                          │
│  └── editions/{editionId}                                  │
│                                                             │
│  REALTIME DATABASE (Jeu temps réel - facturé par bande    │
│  passante, 100K CCU pour $25/mois)                         │
│  ├── rooms/{roomId}                                        │
│  │   ├── state (game state compact)                        │
│  │   ├── players/{playerId}                                │
│  │   └── actions/{actionId}                                │
│  └── presence/{userId}                                     │
│                                                             │
│  CLOUD FUNCTIONS (Logique serveur sécurisée)              │
│  ├── createRoom, joinRoom, leaveRoom                       │
│  ├── processAction (validation côté serveur)               │
│  └── calculateResults                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Firebase

```typescript
// services/firebase/config.ts
import { initializeApp, getApps } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';
import appCheck from '@react-native-firebase/app-check';

export const initializeFirebase = () => {
  if (getApps().length === 0) {
    initializeApp();
  }

  // App Check - OBLIGATOIRE pour sécurité
  appCheck().activate('YOUR_RECAPTCHA_KEY', true);

  // Firestore - Persistence locale pour offline
  firestore().settings({
    persistence: true,
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED
  });

  // Realtime Database - Persistence pour jeu offline
  database().setPersistenceEnabled(true);
};
```

### Synchronisation Temps Réel Optimisée

```typescript
// services/game/MultiplayerSync.ts
import database from '@react-native-firebase/database';

export class MultiplayerSync {
  private roomRef: FirebaseDatabaseTypes.Reference | null = null;
  private listeners: Map<string, () => void> = new Map();

  async joinRoom(roomId: string, playerId: string): Promise<void> {
    this.roomRef = database().ref(`rooms/${roomId}`);

    // Présence - Nettoyage automatique si déconnexion
    const presenceRef = this.roomRef.child(`players/${playerId}/online`);
    presenceRef.onDisconnect().set(false);
    await presenceRef.set(true);

    // Écouter uniquement les changements nécessaires
    this.subscribeToGameState();
    this.subscribeToActions();
  }

  private subscribeToGameState(): void {
    const stateRef = this.roomRef!.child('state');
    
    // ⚡ Optimisation : Écouter seulement les enfants modifiés
    const unsubscribe = stateRef.on('child_changed', (snapshot) => {
      const key = snapshot.key;
      const value = snapshot.val();
      useGameStore.getState().updateGameState({ [key!]: value });
    });

    this.listeners.set('state', () => stateRef.off('child_changed', unsubscribe));
  }

  private subscribeToActions(): void {
    const actionsRef = this.roomRef!.child('actions');
    
    // Écouter seulement les nouvelles actions (pas l'historique complet)
    const unsubscribe = actionsRef
      .orderByChild('timestamp')
      .startAt(Date.now())
      .on('child_added', (snapshot) => {
        const action = snapshot.val();
        useGameStore.getState().processRemoteAction(action);
      });

    this.listeners.set('actions', () => actionsRef.off('child_added', unsubscribe));
  }

  async sendAction(action: GameAction): Promise<void> {
    // Actions compactes pour minimiser bande passante
    const compactAction = {
      t: action.type,           // type abrégé
      p: action.playerId,       // player
      d: action.data,           // data
      ts: database.ServerValue.TIMESTAMP
    };

    await this.roomRef!.child('actions').push(compactAction);
  }

  leaveRoom(): void {
    // Nettoyer tous les listeners
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
    this.roomRef = null;
  }
}
```

### Structure de Données Firestore Optimisée

```typescript
// types/firebase.types.ts

// Document utilisateur - Lecture peu fréquente
interface UserDocument {
  uid: string;
  email: string;
  pseudo: string;
  avatar: string;
  niveau: {
    rang: EntrepreneurRank;
    xp: number;
  };
  stats: {
    parties: number;
    victoires: number;
    xpTotal: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Sous-collection pour startups (évite de charger tout le portfolio)
interface StartupDocument {
  id: string;
  nom: string;
  description: string;
  secteur: string;
  valorisation: number;
  createdAt: Timestamp;
}

// État de jeu compact pour Realtime Database
interface GameStateRTDB {
  s: 'waiting' | 'playing' | 'finished';  // status
  t: number;                               // currentTurn (player index)
  d: number | null;                        // lastDiceValue
  p: {                                     // positions (compact)
    [playerId: string]: number;            // position index sur le plateau
  };
  j: {                                     // jetons
    [playerId: string]: number;
  };
}
```

### Règles de Sécurité Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Fonctions helpers
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Users - Lecture publique du profil, écriture propriétaire
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
      
      // Startups - Sous-collection
      match /startups/{startupId} {
        allow read: if isAuthenticated();
        allow write: if isOwner(userId);
      }
    }

    // Leaderboard - Lecture seule (mis à jour par Cloud Functions)
    match /leaderboard/{docId} {
      allow read: if isAuthenticated();
      allow write: if false; // Uniquement via Cloud Functions
    }

    // Editions - Lecture seule
    match /editions/{editionId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
  }
}
```

### Règles Realtime Database

```json
// database.rules.json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null && data.child('players').child(auth.uid).exists()",
        ".write": "auth != null",
        "state": {
          ".validate": "newData.hasChildren(['s', 't', 'p', 'j'])"
        },
        "actions": {
          "$actionId": {
            ".validate": "newData.child('p').val() == auth.uid"
          }
        }
      }
    },
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth.uid == $userId"
      }
    }
  }
}
```

---

## 🎨 STATE MANAGEMENT AVEC ZUSTAND

### Store Principal du Jeu

```typescript
// stores/useGameStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface GameState {
  // État du jeu
  status: 'idle' | 'setup' | 'playing' | 'paused' | 'finished';
  mode: 'local' | 'online' | null;
  edition: Edition | null;
  
  // Joueurs
  players: Player[];
  currentPlayerIndex: number;
  
  // Plateau
  positions: Record<string, number>;
  
  // Tour en cours
  diceValue: number | null;
  canRoll: boolean;
  currentEvent: GameEvent | null;
  
  // Jetons
  tokens: Record<string, number>;
  
  // Actions
  initGame: (config: GameConfig) => void;
  rollDice: () => void;
  movePawn: (playerId: string, steps: number) => void;
  handleEvent: (event: GameEvent) => void;
  answerQuiz: (answerId: number) => void;
  endTurn: () => void;
  updateGameState: (partial: Partial<GameState>) => void;
  processRemoteAction: (action: GameAction) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      status: 'idle',
      mode: null,
      edition: null,
      players: [],
      currentPlayerIndex: 0,
      positions: {},
      diceValue: null,
      canRoll: true,
      currentEvent: null,
      tokens: {},

      initGame: (config) => set((state) => {
        state.status = 'setup';
        state.mode = config.mode;
        state.edition = config.edition;
        state.players = config.players;
        state.currentPlayerIndex = 0;
        
        // Initialiser positions et jetons
        config.players.forEach((player) => {
          state.positions[player.id] = -1; // -1 = dans la maison
          state.tokens[player.id] = 0;
        });
      }),

      rollDice: () => {
        const value = Math.floor(Math.random() * 6) + 1;
        
        set((state) => {
          state.diceValue = value;
          state.canRoll = false;
        });

        // Auto-move après animation
        setTimeout(() => {
          const { currentPlayerIndex, players } = get();
          const currentPlayer = players[currentPlayerIndex];
          get().movePawn(currentPlayer.id, value);
        }, 1000);
      },

      movePawn: (playerId, steps) => set((state) => {
        const currentPos = state.positions[playerId];
        const newPos = currentPos === -1 
          ? 0 // Sortie de la maison
          : Math.min(currentPos + steps, 51); // 52 cases max
        
        state.positions[playerId] = newPos;

        // Vérifier événement sur la case
        const cellEvent = getCellEvent(newPos, state.edition!);
        if (cellEvent) {
          state.currentEvent = cellEvent;
        }
      }),

      handleEvent: (event) => set((state) => {
        // Logique selon type d'événement
        switch (event.type) {
          case 'funding':
            const currentPlayer = state.players[state.currentPlayerIndex];
            state.tokens[currentPlayer.id] += event.tokens;
            break;
          case 'challenge':
            state.tokens[state.players[state.currentPlayerIndex].id] -= event.tokens;
            break;
          // ... autres types
        }
        state.currentEvent = null;
      }),

      answerQuiz: (answerId) => set((state) => {
        const quiz = state.currentEvent as QuizEvent;
        const isCorrect = answerId === quiz.correctAnswer;
        const currentPlayer = state.players[state.currentPlayerIndex];
        
        state.tokens[currentPlayer.id] += isCorrect ? quiz.rewardTokens : -quiz.penaltyTokens;
        state.currentEvent = null;
      }),

      endTurn: () => set((state) => {
        // Si dé = 6, rejouer
        if (state.diceValue !== 6) {
          state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        }
        state.diceValue = null;
        state.canRoll = true;
      }),

      updateGameState: (partial) => set((state) => {
        Object.assign(state, partial);
      }),

      processRemoteAction: (action) => {
        // Traiter action reçue du serveur
        const { t: type, p: playerId, d: data } = action;
        
        switch (type) {
          case 'ROLL':
            set((state) => { state.diceValue = data.value; });
            break;
          case 'MOVE':
            set((state) => { state.positions[playerId] = data.position; });
            break;
          // ... autres actions
        }
      },

      reset: () => set(() => ({
        status: 'idle',
        mode: null,
        edition: null,
        players: [],
        currentPlayerIndex: 0,
        positions: {},
        diceValue: null,
        canRoll: true,
        currentEvent: null,
        tokens: {},
      })),
    }))
  )
);

// Sélecteurs optimisés (évite re-renders inutiles)
export const useCurrentPlayer = () => 
  useGameStore((state) => state.players[state.currentPlayerIndex]);

export const usePlayerTokens = (playerId: string) =>
  useGameStore((state) => state.tokens[playerId]);

export const useCanRoll = () =>
  useGameStore((state) => state.canRoll && state.status === 'playing');
```

### Store Utilisateur

```typescript
// stores/useUserStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface UserState {
  user: User | null;
  isGuest: boolean;
  setUser: (user: User) => void;
  setGuest: (isGuest: boolean) => void;
  logout: () => void;
}

// Storage sécurisé pour données sensibles
const secureStorage = {
  getItem: async (name: string) => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isGuest: false,
      setUser: (user) => set({ user, isGuest: false }),
      setGuest: (isGuest) => set({ isGuest, user: null }),
      logout: () => set({ user: null, isGuest: false }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

---

## 🎮 COMPOSANTS CLÉS

### Plateau de Jeu avec Canvas Optimisé

```typescript
// components/game/GameBoard/index.tsx
import { memo, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useGameStore } from '@/stores/useGameStore';
import { BoardCell } from './BoardCell';
import { Pawn } from './Pawn';
import { CenterZone } from './CenterZone';
import { BOARD_LAYOUT, CELL_TYPES } from '@/data/board-layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 400);
const CELL_SIZE = BOARD_SIZE / 13;

export const GameBoard = memo(() => {
  const players = useGameStore((state) => state.players);
  const positions = useGameStore((state) => state.positions);

  // Mémoriser les cellules (ne changent jamais)
  const cells = useMemo(() => (
    BOARD_LAYOUT.map((cell, index) => (
      <BoardCell
        key={`cell-${index}`}
        type={cell.type}
        position={cell.position}
        cellSize={CELL_SIZE}
      />
    ))
  ), []);

  // Calculer positions des pions
  const pawns = useMemo(() => (
    players.map((player) => ({
      ...player,
      position: getPixelPosition(positions[player.id], player.color, CELL_SIZE),
    }))
  ), [players, positions]);

  return (
    <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
      {/* Cellules du plateau */}
      {cells}
      
      {/* Zone centrale */}
      <CenterZone size={CELL_SIZE * 3} />
      
      {/* Pions animés */}
      {pawns.map((pawn) => (
        <Pawn
          key={pawn.id}
          color={pawn.color}
          position={pawn.position}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
```

### Animation du Dé avec Reanimated

```typescript
// components/game/Dice.tsx
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGameStore, useCanRoll } from '@/stores/useGameStore';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export const Dice: React.FC = () => {
  const [displayValue, setDisplayValue] = useState(1);
  const canRoll = useCanRoll();
  const rollDice = useGameStore((state) => state.rollDice);
  
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const handleRoll = useCallback(() => {
    if (!canRoll) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animation de lancer
    scale.value = withSequence(
      withSpring(0.8),
      withSpring(1.2),
      withSpring(1)
    );

    rotation.value = withSequence(
      withTiming(rotation.value + 720, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Simuler plusieurs valeurs pendant l'animation
    const interval = setInterval(() => {
      runOnJS(setDisplayValue)(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      runOnJS(rollDice)();
    }, 600);
  }, [canRoll, rollDice]);

  return (
    <Pressable onPress={handleRoll} disabled={!canRoll}>
      <Animated.View 
        style={[
          styles.dice, 
          animatedStyle,
          !canRoll && styles.disabled
        ]}
      >
        <Animated.Text style={styles.diceText}>
          {DICE_FACES[displayValue - 1]}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  dice: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  diceText: {
    fontSize: 48,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

### Popup Quiz avec Animation

```typescript
// components/popups/QuizPopup.tsx
import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '@/stores/useGameStore';
import { Button } from '@/components/ui/Button';

interface QuizPopupProps {
  quiz: QuizEvent;
  onClose: () => void;
}

export const QuizPopup: React.FC<QuizPopupProps> = ({ quiz, onClose }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const answerQuiz = useGameStore((state) => state.answerQuiz);

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    const isCorrect = index === quiz.correctAnswer;
    Haptics.notificationAsync(
      isCorrect 
        ? Haptics.NotificationFeedbackType.Success 
        : Haptics.NotificationFeedbackType.Error
    );

    // Fermer après délai
    setTimeout(() => {
      answerQuiz(index);
      onClose();
    }, 2000);
  }, [selectedAnswer, quiz, answerQuiz, onClose]);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <Animated.View
        entering={SlideInDown.springify().damping(15)}
        exiting={SlideOutDown.duration(200)}
        style={styles.container}
      >
        {/* Catégorie */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{quiz.category}</Text>
        </View>

        {/* Question */}
        <Text style={styles.question}>{quiz.question}</Text>

        {/* Options */}
        <View style={styles.options}>
          {quiz.options.map((option, index) => (
            <AnswerOption
              key={index}
              text={option}
              index={index}
              selected={selectedAnswer === index}
              correct={showResult && index === quiz.correctAnswer}
              wrong={showResult && selectedAnswer === index && index !== quiz.correctAnswer}
              onPress={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
            />
          ))}
        </View>

        {/* Feedback */}
        {showResult && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[
              styles.feedback,
              selectedAnswer === quiz.correctAnswer 
                ? styles.feedbackCorrect 
                : styles.feedbackWrong
            ]}
          >
            <Text style={styles.feedbackText}>
              {selectedAnswer === quiz.correctAnswer
                ? `+${quiz.rewardTokens} jetons 🎉`
                : `-${quiz.penaltyTokens} jetons 😔`}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

// ... styles
```

---

## 🔊 SYSTÈME AUDIO OPTIMISÉ

```typescript
// hooks/useSound.ts
import { useCallback, useRef, useEffect } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { useSettingsStore } from '@/stores/useSettingsStore';

const SOUNDS = {
  diceRoll: require('@/assets/sounds/dice-roll.mp3'),
  pawnMove: require('@/assets/sounds/pawn-move.mp3'),
  quizCorrect: require('@/assets/sounds/quiz-correct.mp3'),
  quizWrong: require('@/assets/sounds/quiz-wrong.mp3'),
  tokenGain: require('@/assets/sounds/token-gain.mp3'),
  tokenLoss: require('@/assets/sounds/token-loss.mp3'),
  victory: require('@/assets/sounds/victory.mp3'),
} as const;

type SoundName = keyof typeof SOUNDS;

export const useSound = () => {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const playersRef = useRef<Map<SoundName, ReturnType<typeof useAudioPlayer>>>(new Map());

  // Pré-charger les sons
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([name, source]) => {
      const player = useAudioPlayer(source);
      playersRef.current.set(name as SoundName, player);
    });

    return () => {
      playersRef.current.forEach((player) => player.remove());
    };
  }, []);

  const play = useCallback((name: SoundName) => {
    if (!soundEnabled) return;
    
    const player = playersRef.current.get(name);
    if (player) {
      player.seekTo(0);
      player.play();
    }
  }, [soundEnabled]);

  return { play };
};
```

---

## ✅ CONFIGURATION TYPESCRIPT STRICTE

```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "functions"]
}
```

---

## 🧪 TESTS

```typescript
// __tests__/stores/useGameStore.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useGameStore } from '@/stores/useGameStore';

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('should initialize game correctly', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.initGame({
        mode: 'local',
        edition: mockEdition,
        players: mockPlayers,
      });
    });

    expect(result.current.status).toBe('setup');
    expect(result.current.players).toHaveLength(2);
    expect(result.current.tokens).toEqual({ 'p1': 0, 'p2': 0 });
  });

  it('should roll dice and update state', () => {
    const { result } = renderHook(() => useGameStore());
    
    act(() => {
      result.current.initGame(mockConfig);
      result.current.rollDice();
    });

    expect(result.current.diceValue).toBeGreaterThanOrEqual(1);
    expect(result.current.diceValue).toBeLessThanOrEqual(6);
    expect(result.current.canRoll).toBe(false);
  });
});
```

---

## 📱 APP.JSON COMPLET

```json
{
  "expo": {
    "name": "Startup Ludo",
    "slug": "startup-ludo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "startupludo",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0C243E"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.startupludo",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0C243E"
      },
      "package": "com.yourcompany.startupludo",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 🚀 COMMANDES DE DÉMARRAGE

```bash
# Création du projet
npx create-expo-app@latest startup-ludo --template tabs
cd startup-ludo

# Installation des dépendances principales
npx expo install expo-router react-native-reanimated react-native-gesture-handler
npx expo install @shopify/flash-list zustand
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/database
npx expo install nativewind tailwindcss
npx expo install expo-font expo-haptics expo-audio expo-secure-store
npx expo install lottie-react-native react-native-svg

# Dev dependencies
npm install -D @types/react typescript eslint prettier jest @testing-library/react-native

# Vérification de la configuration
npx expo-doctor

# Lancement
npx expo start
```

---

## 📋 CHECKLIST DE DÉVELOPPEMENT

### Phase 1 : Fondations (Priorité Haute)
- [ ] Configuration projet Expo SDK 55
- [ ] Architecture de fichiers
- [ ] Configuration TypeScript stricte
- [ ] Intégration Firebase (Auth, Firestore, RTDB)
- [ ] Stores Zustand (Auth, Game, User, Settings)
- [ ] Composants UI de base (Button, Card, Input, Modal)
- [ ] Système de navigation Expo Router

### Phase 2 : Gameplay Core (Priorité Haute)
- [ ] Plateau de jeu 13x13 responsive
- [ ] Animation des pions avec Reanimated
- [ ] Système de dé avec animations
- [ ] Logique de déplacement
- [ ] Popups d'événements (Quiz, Financement, Événement, Duel)
- [ ] Mode Solo vs IA
- [ ] Mode Tour par Tour local

### Phase 3 : Utilisateur (Priorité Moyenne)
- [ ] Authentification (Email, Google, Apple)
- [ ] Mode Invité
- [ ] Profil utilisateur
- [ ] Portfolio et création de startups
- [ ] Système de rangs et XP
- [ ] Classement

### Phase 4 : Multijoueur (Priorité Basse)
- [ ] Création/Rejoindre une Room
- [ ] Synchronisation temps réel
- [ ] Matchmaking
- [ ] Chat emojis
- [ ] Gestion déconnexion/reconnexion

### Phase 5 : Polish
- [ ] Animations Lottie
- [ ] Sons et Haptics
- [ ] Internationalisation (FR/EN)
- [ ] Mode sombre
- [ ] Achievements
- [ ] Notifications push

---

## ⚠️ RÈGLES IMPORTANTES

1. **Toujours utiliser TypeScript strict** - Pas de `any`, pas d'assertions de type non nécessaires
2. **Animations sur le thread UI** - Utiliser `useNativeDriver: true` ou Reanimated worklets
3. **Mémoisation stratégique** - `memo`, `useMemo`, `useCallback` uniquement où nécessaire
4. **Firebase économe** - Realtime DB pour le jeu, Firestore pour persistence, batching des écritures
5. **Composants purs** - Éviter les side effects dans le render
6. **Erreurs gérées** - Error boundaries, try/catch sur les appels Firebase
7. **Tests critiques** - Stores, logique de jeu, helpers
8. **Validation Zod** - Toutes les données entrantes (API, Firebase)

---

*Document généré le 27/01/2026 - Stack optimisée 2026*
