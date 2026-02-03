# Plan d'implémentation - Système de Duel

## 1. Résumé de la logique

### Déclenchement
- Un joueur tombe sur une case "duel"
- Il choisit un adversaire parmi les autres joueurs (automatique si 2 joueurs)
- Les autres joueurs (spectateurs) voient un écran d'attente

### Format du Duel
- **3 questions** par duel
- Chaque question a **3 options de réponse** (toutes "correctes" mais avec des points différents)
- Points par réponse : **30 / 20 / 10** (meilleure → moins bonne)
- Score total possible : **30 à 90 points**

### Modes de jeu

| Mode | Joueur 1 | Joueur 2 | Spectateurs |
|------|----------|----------|-------------|
| Local (2 joueurs) | Répond aux 3 questions | Écran "Prépare-toi" puis répond aux mêmes questions | - |
| Local (3-4 joueurs) | Répond aux 3 questions | Écran "Prépare-toi" puis répond | Popup d'attente |
| Contre IA | Répond aux 3 questions | Score aléatoire attribué (ex: 30, 50, 70, 90) | - |
| Multijoueur online | Répond en parallèle | Répond en parallèle | Popup d'attente temps réel |

### Résultats
- **Gagnant** (plus de points) → +3 jetons
- **Perdant** → 0 jeton
- **Égalité** → +1 jeton chacun

---

## 2. Modifications des Types

### Fichier: `src/types/index.ts`

```typescript
// Nouvelle structure pour les questions de duel
export interface DuelQuestion {
  id: string;
  question: string;
  options: DuelOption[];
  category: string;
}

export interface DuelOption {
  text: string;
  points: number; // 30, 20, ou 10
}

// Mise à jour de DuelEvent
export interface DuelEvent {
  id: string;
  questions: DuelQuestion[]; // 3 questions
  category: string;
}

// État du duel en cours
export interface DuelState {
  challengerId: string;      // Joueur qui a déclenché le duel
  opponentId: string;        // Adversaire choisi
  questions: DuelQuestion[];
  challengerAnswers: number[]; // Index des réponses (0, 1, 2)
  opponentAnswers: number[];
  challengerScore: number;
  opponentScore: number;
  phase: 'select_opponent' | 'challenger_turn' | 'opponent_prepare' | 'opponent_turn' | 'result';
  currentQuestionIndex: number;
}
```

---

## 3. Structure des Composants

### Nouveaux composants à créer

```
src/components/game/popups/
├── DuelPopup.tsx              (refactoring complet)
├── DuelSelectOpponentPopup.tsx (nouveau)
├── DuelPreparePopup.tsx        (nouveau)
├── DuelSpectatorPopup.tsx      (nouveau)
└── DuelResultPopup.tsx         (nouveau - optionnel)
```

### 3.1 DuelSelectOpponentPopup
**But**: Choisir l'adversaire (3-4 joueurs)

```
┌─────────────────────────────┐
│      [icône duel]           │
│         DUEL                │
│                             │
│   Choisis ton adversaire    │
│                             │
│  ┌─────────────────────┐    │
│  │ [avatar] Joueur 2   │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ [avatar] Joueur 3   │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### 3.2 DuelPopup (refactoré)
**Phases**:
1. **Intro** - Affiche les 2 duellistes avec "VS"
2. **Questions** - 3 questions successives (1/3, 2/3, 3/3)
3. **Attente** - "En attente de l'adversaire..." (online)
4. **Résultat** - Comparaison des scores

```
┌─────────────────────────────┐
│  [VS]        DUEL           │
│            1/3              │
│                             │
│  ┌───────────────────────┐  │
│  │ Question text here... │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Option A (30 pts)     │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Option B (20 pts)     │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Option C (10 pts)     │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### 3.3 DuelPreparePopup
**But**: Écran de transition pour le 2e joueur (local)

```
┌─────────────────────────────┐
│      [icône duel]           │
│         DUEL                │
│                             │
│  ┌─────────────────────┐    │
│  │ [avatar] Nom joueur │    │
│  └─────────────────────┘    │
│                             │
│    Prépare-toi à répondre   │
│      aux 3 questions !      │
│                             │
│     [ COMMENCER ]           │
└─────────────────────────────┘
```

### 3.4 DuelSpectatorPopup
**But**: Informer les spectateurs qu'un duel est en cours

```
┌─────────────────────────────┐
│      [icône duel]           │
│      DUEL EN COURS          │
│                             │
│  [avatar1]  VS  [avatar2]   │
│   Joueur1       Joueur2     │
│                             │
│   En attente du résultat... │
│        [loader]             │
└─────────────────────────────┘
```

---

## 4. Logique du GameEngine

### Fichier: `src/services/game/GameEngine.ts`

```typescript
// Nouvelles méthodes à ajouter

class GameEngine {
  // État du duel en cours
  private duelState: DuelState | null = null;

  // Démarrer un duel
  startDuel(challengerId: string, opponentId: string, questions: DuelQuestion[]): void {
    this.duelState = {
      challengerId,
      opponentId,
      questions,
      challengerAnswers: [],
      opponentAnswers: [],
      challengerScore: 0,
      opponentScore: 0,
      phase: 'challenger_turn',
      currentQuestionIndex: 0,
    };
  }

  // Soumettre une réponse
  submitDuelAnswer(playerId: string, answerIndex: number): void {
    if (!this.duelState) return;

    const question = this.duelState.questions[this.duelState.currentQuestionIndex];
    const points = question.options[answerIndex].points;

    if (playerId === this.duelState.challengerId) {
      this.duelState.challengerAnswers.push(answerIndex);
      this.duelState.challengerScore += points;
    } else {
      this.duelState.opponentAnswers.push(answerIndex);
      this.duelState.opponentScore += points;
    }
  }

  // Générer un score IA
  generateAIScore(): number {
    const possibleScores = [30, 40, 50, 60, 70, 80, 90];
    return possibleScores[Math.floor(Math.random() * possibleScores.length)];
  }

  // Calculer le résultat
  resolveDuel(): { winnerId: string | null; challengerReward: number; opponentReward: number } {
    if (!this.duelState) return { winnerId: null, challengerReward: 0, opponentReward: 0 };

    const { challengerId, opponentId, challengerScore, opponentScore } = this.duelState;

    if (challengerScore > opponentScore) {
      return { winnerId: challengerId, challengerReward: 3, opponentReward: 0 };
    } else if (opponentScore > challengerScore) {
      return { winnerId: opponentId, challengerReward: 0, opponentReward: 3 };
    } else {
      return { winnerId: null, challengerReward: 1, opponentReward: 1 }; // Égalité
    }
  }
}
```

---

## 5. Hook pour gérer le duel

### Fichier: `src/hooks/useDuel.ts` (nouveau)

```typescript
interface UseDuelReturn {
  // État
  duelState: DuelState | null;
  currentQuestion: DuelQuestion | null;
  isMyTurn: boolean;
  isWaitingForOpponent: boolean;

  // Actions
  selectOpponent: (opponentId: string) => void;
  submitAnswer: (answerIndex: number) => void;
  startOpponentTurn: () => void;

  // Résultat
  result: DuelResult | null;
}

export function useDuel(gameEngine: GameEngine, currentPlayerId: string): UseDuelReturn {
  // Implémentation...
}
```

---

## 6. Données de test (Mock)

### Fichier: `src/data/duelQuestions.ts` (nouveau)

```typescript
export const DUEL_QUESTIONS: DuelQuestion[] = [
  {
    id: 'duel-q1',
    question: "Une bonne proposition de valeur doit communiquer quoi en priorité?",
    options: [
      { text: "Le problème résolu et le bénéfice client", points: 30 },
      { text: "L'histoire et la vision du fondateur", points: 20 },
      { text: "Les technologies utilisées et les fonctionnalités", points: 10 },
    ],
    category: 'business',
  },
  // ... autres questions
];

// Fonction pour obtenir 3 questions aléatoires
export function getRandomDuelQuestions(count: number = 3): DuelQuestion[] {
  const shuffled = [...DUEL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

---

## 7. Gestion Online (Firestore)

### Structure Firestore

```
games/{gameId}/duel {
  challengerId: string
  opponentId: string
  questions: DuelQuestion[]
  challengerAnswers: number[]
  opponentAnswers: number[]
  challengerScore: number
  opponentScore: number
  status: 'in_progress' | 'completed'
  createdAt: Timestamp
}
```

### Listeners temps réel
- Chaque joueur écoute les changements sur `/games/{gameId}/duel`
- Quand les 2 ont fini → calcul du résultat
- Broadcast du résultat à tous les joueurs

---

## 8. Étapes d'implémentation

### Phase 1: Types et données
- [ ] Mettre à jour `src/types/index.ts` avec les nouveaux types
- [ ] Créer `src/data/duelQuestions.ts` avec des questions de test

### Phase 2: Composants UI
- [ ] Créer `DuelSelectOpponentPopup.tsx`
- [ ] Créer `DuelPreparePopup.tsx`
- [ ] Créer `DuelSpectatorPopup.tsx`
- [ ] Refactorer `DuelPopup.tsx` pour le nouveau format (3 questions)

### Phase 3: Logique locale
- [ ] Créer `src/hooks/useDuel.ts`
- [ ] Intégrer dans `GameEngine.ts`
- [ ] Tester en mode local 2 joueurs
- [ ] Tester en mode local 3-4 joueurs
- [ ] Tester contre IA

### Phase 4: Mode online
- [ ] Créer les règles Firestore pour `/duel`
- [ ] Implémenter la synchronisation temps réel
- [ ] Tester le mode online

### Phase 5: Polish
- [ ] Animations et transitions
- [ ] Sons et haptics
- [ ] Tests edge cases (déconnexion, timeout, etc.)

---

## 9. Design System à respecter

```typescript
// Couleurs
COLORS.events.duel = '#FF6B6B' // Rouge pour le duel

// Card style
card: {
  backgroundColor: COLORS.white,
  borderRadius: BORDER_RADIUS['3xl'],
  maxWidth: 360,
  width: '92%',
  ...SHADOWS.xl,
}

// Question box
questionBox: {
  backgroundColor: '#F8F9FA',
  borderRadius: BORDER_RADIUS.xl,
  padding: SPACING[4],
}

// Options
optionPill: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F5F7FA',
  borderRadius: BORDER_RADIUS.xl,
  padding: SPACING[3],
  ...SHADOWS.sm,
}
```
