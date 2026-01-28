# 🎮 PROMPT CLAUDE CODE - STARTUP LUDO

## 🎯 TA MISSION

Tu es un **expert senior React Native/Expo** spécialisé en applications mobiles performantes. Tu dois générer le projet complet **"Startup Ludo"** - un jeu de plateau mobile éducatif sur l'entrepreneuriat.

**Tu as accès à 2 documents :**
1. **Ce fichier (PROMPT)** → Tes instructions et règles absolues
2. **FICHE_TECHNIQUE.md** → Référence détaillée pour les implémentations

---

## 📋 CONTEXTE RAPIDE

Startup Ludo = Jeu des Petits Chevaux (Ludo) + Quiz entrepreneuriat
- Plateau 13x13 cases
- 2-4 joueurs
- Modes : Solo vs IA, Local multijoueur, Online multijoueur
- Events sur les cases : Quiz, Financement, Duel, Événements (opportunité/challenge)
- Objectif : Premier à atteindre le centre + accumuler des jetons

---

## ⚡ STACK OBLIGATOIRE (2026)

```
expo: ~55.0.0
react-native: 0.83.x
react: 19.2.x
typescript: 5.7.x (strict mode)
```

| Besoin | Librairie | ❌ PAS ça |
|--------|-----------|-----------|
| Navigation | `expo-router` ~4.0 | ~~React Navigation classique~~ |
| State | `zustand` ^5.0 | ~~Redux, MobX, Context seul~~ |
| Animations | `react-native-reanimated` ^4.0 | ~~Animated API basique~~ |
| Listes | `@shopify/flash-list` ^2.0 | ~~FlatList~~ |
| Styling | `nativewind` ^4.0 + `tailwindcss` | ~~StyleSheet partout~~ |
| Audio | `expo-audio` | ~~expo-av (deprecated)~~ |
| Firebase | `@react-native-firebase/*` ^21.0 | ~~firebase JS SDK web~~ |

---

## 🚨 RÈGLES ABSOLUES

### ✅ FAIS TOUJOURS

1. **TypeScript strict** - Jamais de `any`, jamais de `// @ts-ignore`
2. **New Architecture** - `newArchEnabled: true` dans app.json
3. **Animations sur UI thread** - Utilise `useAnimatedStyle`, `worklet`, `runOnJS`
4. **Composants mémoïsés** - `memo()` sur composants de liste et plateau
5. **Expo Router file-based** - Structure `/app` avec `_layout.tsx`
6. **Zustand avec immer** - Pour mutations immutables propres
7. **Firebase hybride** - Realtime DB pour jeu temps réel, Firestore pour persistence
8. **Validation Zod** - Toutes données externes (API, Firebase, user input)
9. **Error Boundaries** - Sur chaque section critique
10. **Alias imports** - `@/` pour `src/`

### ❌ NE FAIS JAMAIS

1. ~~Redux, MobX, ou Context API seul pour state global~~
2. ~~Animated API basique de React Native~~
3. ~~FlatList (utilise FlashList)~~
4. ~~expo-av (deprecated, utilise expo-audio)~~
5. ~~Firebase JS SDK web (utilise @react-native-firebase)~~
6. ~~Inline styles répétés (utilise NativeWind)~~
7. ~~console.log en prod (utilise __DEV__)~~
8. ~~any, as any, @ts-ignore~~
9. ~~useEffect pour state sync (utilise Zustand subscriptions)~~
10. ~~Firestore pour sync temps réel du jeu (trop cher, utilise Realtime DB)~~

---

## 📁 STRUCTURE PROJET

```
startup-ludo/
├── src/
│   ├── app/                    # Expo Router
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── (auth)/
│   │   ├── (tabs)/
│   │   ├── (game)/
│   │   └── (startup)/
│   ├── components/
│   │   ├── ui/                 # Button, Card, Input, Modal...
│   │   ├── game/               # GameBoard, Pawn, Dice...
│   │   ├── popups/             # QuizPopup, DuelPopup...
│   │   └── common/             # Loading, ErrorBoundary...
│   ├── stores/                 # Zustand stores
│   ├── services/               # Firebase, GameEngine, AI
│   ├── hooks/                  # Custom hooks
│   ├── utils/                  # Helpers, constants
│   ├── types/                  # TypeScript types
│   ├── data/                   # JSON editions/quiz
│   ├── i18n/                   # Traductions
│   └── styles/                 # Theme, colors
├── assets/
├── functions/                  # Cloud Functions
└── [configs...]
```

---

## 🔥 ARCHITECTURE FIREBASE CRITIQUE

```
┌─────────────────────────────────────────────────┐
│  REALTIME DATABASE (jeu temps réel)             │
│  → rooms/{roomId}/state, players, actions       │
│  → Facturé par BANDE PASSANTE (économique)      │
│  → 100K connexions simultanées = $25/mois       │
├─────────────────────────────────────────────────┤
│  FIRESTORE (données persistantes)               │
│  → users/{userId} + sous-collection startups    │
│  → leaderboard/, editions/                      │
│  → Facturé par OPÉRATION (cher si mal utilisé)  │
├─────────────────────────────────────────────────┤
│  CLOUD FUNCTIONS (logique sécurisée)            │
│  → createRoom, joinRoom, processAction          │
│  → Validation côté serveur                      │
└─────────────────────────────────────────────────┘
```

**RÈGLE D'OR** : Jeu multijoueur = Realtime DB. Profil/Stats = Firestore.

---

## 📦 GÉNÉRATION PAR PHASES

### PHASE 1 : Fondations (Fais ça EN PREMIER)

```
□ npx create-expo-app@latest startup-ludo
□ Configuration TypeScript strict (tsconfig.json)
□ Installation dépendances (voir FICHE_TECHNIQUE.md)
□ Structure dossiers src/
□ app.json avec newArchEnabled: true
□ Configuration NativeWind + Tailwind
□ Theme/Colors/Typography (selon specs design)
□ Composants UI de base (Button, Card, Input, Modal)
□ Configuration Firebase (config.ts)
□ Stores Zustand vides (useAuthStore, useGameStore, useUserStore)
□ Root layout avec providers
```

### PHASE 2 : Navigation & Auth

```
□ Expo Router structure complète
□ Écran d'accueil (index.tsx)
□ Flux authentification (login, register, forgot-password)
□ Mode invité
□ Navigation tabs (home, portfolio, classement, profil)
□ Guards de navigation (auth required)
```

### PHASE 3 : Gameplay Core ⭐ PRIORITÉ

```
□ GameBoard composant (plateau 13x13)
□ BoardCell avec types d'événements
□ Pawn avec animations Reanimated
□ Dice avec animation de lancer
□ PlayerCard (infos joueur, jetons, tour)
□ useGameStore complet (logique de jeu)
□ GameEngine service (règles du jeu)
□ Popups : QuizPopup, FundingPopup, EventPopup, DuelPopup
□ Mode Solo vs IA (AIPlayer service)
□ Mode Tour par Tour local
□ Écran résultats
```

### PHASE 4 : Données & Contenu

```
□ JSON editions (classic, agriculture, education...)
□ Quiz par catégorie
□ Événements (opportunités/challenges)
□ Financements
□ Duels
□ Idées de startups
```

### PHASE 5 : Profil & Progression

```
□ Profil utilisateur complet
□ Portfolio de startups
□ Création de startup (flux complet)
□ Système de rangs et XP
□ Achievements
□ Classement (leaderboard)
```

### PHASE 6 : Multijoueur Online

```
□ MultiplayerSync service (Realtime DB)
□ Création de room
□ Rejoindre une room
□ Synchronisation état de jeu
□ Chat emojis
□ Gestion déconnexion/reconnexion
□ Cloud Functions (validation serveur)
```

### PHASE 7 : Polish

```
□ Sons (useSound hook)
□ Haptics (useHaptics hook)
□ Animations Lottie
□ Internationalisation FR/EN
□ Mode sombre
□ Splash screen
□ App icons
```

---

## 🎨 DESIGN SYSTEM RAPIDE

```typescript
// Colors
const COLORS = {
  primary: '#FFBC40',      // Jaune doré (accent)
  background: '#0C243E',   // Bleu foncé
  backgroundGradient: ['#0C243E', '#194F8A', '#0C243E'],
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  card: 'rgba(0,0,0,0.3)',
  
  // Joueurs
  playerYellow: '#FFBC40',
  playerBlue: '#1F91D0',
  playerGreen: '#4CAF50',
  playerRed: '#F35145',
  
  // Events
  quiz: '#4A90E2',
  funding: '#50C878',
  duel: '#FF6B6B',
  event: '#FFB347',
};

// Fonts
const FONTS = {
  title: 'LuckiestGuy',     // Titres, boutons
  body: 'OpenSans',         // Texte courant
  mono: 'SpaceMono',        // Code si besoin
};
```

---

## 🧪 PATTERNS DE CODE ATTENDUS

### Store Zustand
```typescript
// TOUJOURS avec immer et subscribeWithSelector
export const useGameStore = create<GameState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // state...
      // actions avec set((state) => { state.x = y; })
    }))
  )
);
```

### Animation Reanimated
```typescript
// TOUJOURS sur UI thread
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: position.value }]
}));

// Callback vers JS thread
withTiming(100, {}, (finished) => {
  if (finished) runOnJS(onComplete)();
});
```

### Composant mémoïsé
```typescript
export const BoardCell = memo(({ type, onPress }: Props) => {
  const handlePress = useCallback(() => onPress(type), [type, onPress]);
  return <Pressable onPress={handlePress}>...</Pressable>;
});
```

### Firebase listener avec cleanup
```typescript
useEffect(() => {
  const unsubscribe = database()
    .ref(`rooms/${roomId}/state`)
    .on('value', snapshot => { /* ... */ });
  
  return () => database().ref(`rooms/${roomId}/state`).off('value', unsubscribe);
}, [roomId]);
```

---

## ⚠️ PIÈGES À ÉVITER

| Piège | Solution |
|-------|----------|
| Reanimated v4 + NativeWind incompatible | Utiliser Reanimated v3 si conflit |
| Firestore pour jeu temps réel | Utiliser Realtime Database |
| FlashList sans keyExtractor | Toujours fournir keyExtractor |
| useEffect pour sync state | Zustand subscribeWithSelector |
| Animations bloquant JS thread | Toujours useNativeDriver ou worklet |
| Firebase sans App Check | Activer App Check dès le début |
| Console.log en prod | Wrapper avec __DEV__ |

---

## 📝 CHECKLIST AVANT CHAQUE COMMIT

```
□ TypeScript compile sans erreur
□ Pas de any ni @ts-ignore
□ Composants de liste mémoïsés
□ Animations sur UI thread
□ Pas de console.log sans __DEV__
□ Firebase listeners nettoyés (cleanup)
□ Error boundaries en place
□ Types exportés depuis /types
```

---

## 🚀 COMMANDE DE DÉMARRAGE

```bash
# Pour commencer, lance :
npx create-expo-app@latest startup-ludo --template blank-typescript
cd startup-ludo

# Puis installe les dépendances (voir FICHE_TECHNIQUE.md pour la liste complète)
```

---

## 📚 RÉFÉRENCE

Pour les détails d'implémentation (code complet, configs, structures de données), consulte **FICHE_TECHNIQUE.md**.

---

**MAINTENANT, COMMENCE PAR LA PHASE 1.**

Génère la structure de base, les configurations, et les composants UI fondamentaux. Montre-moi le code.
