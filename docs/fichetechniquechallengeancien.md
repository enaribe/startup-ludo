# Fiche Technique : Système de Challenges

## Vision

Transformer Startup Ludo d'une application mono-programme (YEAH) en une plateforme multi-programmes scalable où chaque programme d'accompagnement entrepreneurial est un **Challenge** configurable via données.

---

## Point d'intégration existant

La section "CHALLENGE A LA UNE" existe déjà dans `src/app/(tabs)/home.tsx` (lignes 181-200) avec un placeholder "BIENTOT DISPONIBLE". C'est le point d'entrée principal pour le système de Challenges.

```tsx
// Extrait actuel de home.tsx (à remplacer)
<View style={styles.challengeHeader}>
  <Text style={styles.challengeHeaderTitle}>CHALLENGE A LA UNE</Text>
</View>
<Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.challengeCardWrapper}>
  <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
    <View style={styles.challengeCardContent}>
      {/* Placeholder actuel - À remplacer par ChallengeCard */}
    </View>
  </DynamicGradientBorder>
</Animated.View>
```

### Composants UI existants utilisés :
- `DynamicGradientBorder` - Bordure gradient animée
- `GradientBorder` - Bordure gradient statique
- `RadialBackground` - Fond radial
- `Avatar` - Avatar utilisateur

### Styles existants à réutiliser :
- `styles.challengeHeader` / `styles.challengeHeaderTitle`
- `styles.challengeCardWrapper` / `styles.challengeCardContent`
- `styles.challengeNameText` / `styles.challengeDescText`
- `styles.categoryBadge` / `styles.categoryBadgeText`

---

## Architecture Technique

### 1. Modèles de Données (Types)

```typescript
// src/types/challenge.ts

// ===== CHALLENGE (Programme) =====
export interface Challenge {
  id: string;
  slug: string; // "yeah", "der-fj", "force-n"
  name: string;
  organization: string;
  description: string;

  // Visuels
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;

  // Configuration
  totalLevels: number; // généralement 4
  totalXpRequired: number;
  levels: ChallengeLevel[];
  sectors: ChallengeSector[];

  // Règles
  rules: ChallengeRules;

  // Métadonnées
  isActive: boolean;
  startDate: number | null;
  endDate: number | null;
  version: string; // "v1", "v2"
  createdAt: number;
  updatedAt: number;
}

export interface ChallengeRules {
  sequentialProgression: boolean; // Sous-niveaux dans l'ordre ?
  captureEnabled: boolean; // Méca Monopoly ?
  maxEnrollmentsPerUser: number; // Limite inscriptions simultanées
  allowLevelSkip: boolean;
}

// ===== NIVEAU =====
export interface ChallengeLevel {
  id: string;
  challengeId: string;
  number: number; // 1, 2, 3, 4
  name: string; // "Découverte", "Idéation"
  description: string;
  xpRequired: number;
  subLevels: ChallengeSubLevel[];
  deliverableType: DeliverableType;
  posture: string; // "Curieux", "Porteur de projet"
  iconName: string; // Icône Ionicons
}

export type DeliverableType =
  | 'sector_choice'    // Niveau 1: Choix du secteur
  | 'pitch'            // Niveau 2: Pitch assisté
  | 'business_plan_simple' // Niveau 3: BP simplifié
  | 'business_plan_full'   // Niveau 4: BP complet + Certificat
  | 'custom';

// ===== SOUS-NIVEAU =====
export interface ChallengeSubLevel {
  id: string;
  levelId: string;
  number: number; // 1, 2, 3, 4
  name: string;
  description: string;
  xpRequired: number;
  cardCategories: string[]; // Types de cartes associés
  rules: SubLevelRules;
}

export interface SubLevelRules {
  captureEnabled: boolean;
  sequentialRequired: boolean;
}

// ===== SECTEUR =====
export interface ChallengeSector {
  id: string;
  challengeId: string;
  name: string; // "Production végétale", "Élevage"
  description: string;
  iconName: string;
  category: SectorCategory;
  homeNames: [string, string, string, string]; // 4 maisons
  color: string;
}

export type SectorCategory =
  | 'agriculture'
  | 'technology'
  | 'services'
  | 'commerce'
  | 'artisanat';

// ===== INSCRIPTION =====
export interface ChallengeEnrollment {
  id: string;
  challengeId: string;
  userId: string;

  // Progression
  currentLevel: number; // 1-4
  currentSubLevel: number; // 1-4
  totalXp: number;
  xpByLevel: Record<number, number>; // { 1: 6000, 2: 8500, ... }

  // Choix
  selectedSectorId: string | null;

  // Livrables
  deliverables: ChallengeDeliverables;

  // Statut
  status: EnrollmentStatus;
  championStatus: ChampionStatus | null;

  // Dates
  enrolledAt: number;
  lastPlayedAt: number;
  completedAt: number | null;
}

export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type ChampionStatus = 'local' | 'regional' | 'national';

export interface ChallengeDeliverables {
  sectorChoice?: {
    sectorId: string;
    completedAt: number;
  };
  pitch?: {
    problem: string;
    solution: string;
    target: string;
    viability: string;
    impact: string;
    generatedDocument: string;
    completedAt: number;
  };
  businessPlanSimple?: {
    content: Record<string, string>;
    generatedDocument: string;
    completedAt: number;
  };
  businessPlanFull?: {
    content: Record<string, string>;
    generatedDocument: string;
    certificate: string;
    completedAt: number;
  };
}

// ===== CARTE PÉDAGOGIQUE =====
export interface ChallengeCard {
  id: string;
  challengeId: string;
  levelNumber: number;
  subLevelNumber: number;
  sectorId: string | null; // null = générique

  type: ChallengeCardType;

  // Contenu
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';

  // Quiz/Duel spécifique
  question?: string;
  options?: ChallengeCardOption[];
  correctAnswer?: number;

  // Récompense
  xpReward: number;

  rarity: 'common' | 'rare' | 'legendary';
  createdAt: number;
}

export type ChallengeCardType =
  | 'opportunity'
  | 'challenge'
  | 'quiz'
  | 'duel'
  | 'funding';

export interface ChallengeCardOption {
  text: string;
  points?: number; // Pour duel (30/20/10)
  isCorrect?: boolean; // Pour quiz
}
```

---

### 2. Structure des Fichiers

```
src/
├── types/
│   ├── index.ts          # Types existants
│   └── challenge.ts      # Nouveaux types Challenge
│
├── stores/
│   ├── useChallengeStore.ts      # État global challenges
│   └── useEnrollmentStore.ts     # Inscriptions utilisateur
│
├── services/
│   └── challenges/
│       ├── index.ts
│       ├── ChallengeService.ts   # CRUD challenges
│       ├── EnrollmentService.ts  # Gestion inscriptions
│       ├── ProgressionService.ts # Calcul XP, déblocages
│       └── DeliverableService.ts # Génération livrables
│
├── hooks/
│   ├── useChallenge.ts           # Hook challenge actif
│   ├── useEnrollments.ts         # Hook mes inscriptions
│   ├── useProgression.ts         # Hook progression courante
│   └── useDeliverables.ts        # Hook livrables
│
├── components/
│   └── challenges/
│       ├── index.ts
│       │
│       │── screens/
│       │   ├── ChallengeHubScreen.tsx      # Liste programmes
│       │   ├── ChallengeDetailScreen.tsx   # Détail avant inscription
│       │   ├── MyProgramsScreen.tsx        # Mes inscriptions
│       │   └── ChallengePlayScreen.tsx     # Écran de jeu adapté
│       │
│       ├── cards/
│       │   ├── ChallengeCard.tsx           # Carte programme (liste)
│       │   ├── EnrollmentCard.tsx          # Carte inscription avec progression
│       │   └── LevelCard.tsx               # Carte niveau
│       │
│       ├── progression/
│       │   ├── LevelProgress.tsx           # Barre niveau
│       │   ├── SubLevelProgress.tsx        # Indicateur sous-niveau
│       │   ├── XpBadge.tsx                 # Badge XP animé
│       │   └── UnlockAnimation.tsx         # Animation déblocage
│       │
│       ├── deliverables/
│       │   ├── SectorChoiceModal.tsx       # Choix secteur (N1)
│       │   ├── PitchBuilderModal.tsx       # Assistant pitch (N2)
│       │   ├── BusinessPlanModal.tsx       # Génération BP (N3/N4)
│       │   └── CertificateModal.tsx        # Certificat final
│       │
│       └── ui/
│           ├── ChallengeBanner.tsx         # Bannière avec branding
│           ├── SectorIcon.tsx              # Icône secteur
│           └── ChampionBadge.tsx           # Badge champion
│
├── app/
│   └── (challenges)/
│       ├── _layout.tsx
│       ├── index.tsx                # → ChallengeHubScreen
│       ├── [challengeId]/
│       │   ├── index.tsx            # → ChallengeDetailScreen
│       │   └── play.tsx             # → ChallengePlayScreen
│       └── my-programs.tsx          # → MyProgramsScreen
│
└── data/
    └── challenges/
        ├── yeah.json               # Config YEAH
        ├── der-fj.json             # Config DER-FJ
        └── force-n.json            # Config FORCE-N
```

---

### 3. Store Zustand

```typescript
// src/stores/useChallengeStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Challenge, ChallengeEnrollment } from '@/types/challenge';

interface ChallengeState {
  // Données
  challenges: Challenge[];
  enrollments: ChallengeEnrollment[];
  activeChallengeId: string | null;

  // Computed
  activeChallenge: Challenge | null;
  activeEnrollment: ChallengeEnrollment | null;

  // Actions - Challenges
  setChallengse: (challenges: Challenge[]) => void;

  // Actions - Enrollments
  enrollInChallenge: (challengeId: string, userId: string) => void;
  setActiveChallenge: (challengeId: string) => void;

  // Actions - Progression
  addXp: (amount: number) => void;
  unlockSubLevel: (subLevelNumber: number) => void;
  unlockLevel: (levelNumber: number) => void;

  // Actions - Secteur
  selectSector: (sectorId: string) => void;

  // Actions - Livrables
  savePitch: (pitch: ChallengeDeliverables['pitch']) => void;
  saveBusinessPlan: (type: 'simple' | 'full', content: Record<string, string>) => void;

  // Sync
  syncWithServer: () => Promise<void>;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      challenges: [],
      enrollments: [],
      activeChallengeId: null,

      get activeChallenge() {
        const { challenges, activeChallengeId } = get();
        return challenges.find(c => c.id === activeChallengeId) || null;
      },

      get activeEnrollment() {
        const { enrollments, activeChallengeId } = get();
        return enrollments.find(e => e.challengeId === activeChallengeId) || null;
      },

      // ... implémentations
    }),
    {
      name: 'challenge-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enrollments: state.enrollments,
        activeChallengeId: state.activeChallengeId,
      }),
    }
  )
);
```

---

### 4. Composants UI Clés

#### 4.1 ChallengeCard (Liste des programmes)

```typescript
// Design: Card glassmorphism avec gradient selon couleur du challenge
// Animations: Scale on press, shimmer sur badge "Nouveau"

interface ChallengeCardProps {
  challenge: Challenge;
  enrollment?: ChallengeEnrollment;
  onPress: () => void;
}

// Éléments visuels:
// - Logo du programme (48x48)
// - Nom + Organisation
// - Barre de progression si inscrit
// - Badge "Ouvert" / "Fermé" / "Nouveau"
// - Icône flèche droite
```

#### 4.2 EnrollmentCard (Mes programmes)

```typescript
// Design: Card plus grande avec stats détaillées
// Animations: Progress bar animée, XP counter

interface EnrollmentCardProps {
  enrollment: ChallengeEnrollment;
  challenge: Challenge;
  isActive: boolean;
  onPress: () => void;
  onSetActive: () => void;
}

// Éléments visuels:
// - Bannière du programme (fond)
// - Avatar secteur choisi (si applicable)
// - Niveau actuel avec sous-niveau
// - Barre XP avec pourcentage
// - Bouton "Jouer" ou "Activer"
// - Indicateur statut Champion
```

#### 4.3 LevelProgress (Progression)

```typescript
// Design: Timeline verticale avec nœuds
// Animations: Pulse sur niveau actuel, checkmark sur complétés

interface LevelProgressProps {
  levels: ChallengeLevel[];
  currentLevel: number;
  currentSubLevel: number;
  xpByLevel: Record<number, number>;
}

// Éléments visuels:
// - 4 nœuds (niveaux) connectés verticalement
// - Chaque nœud: icône + nom + XP
// - Sous-niveaux en mini-dots sous chaque niveau
// - Couleur: grisé (locked), accent (current), vert (completed)
```

#### 4.4 SectorChoiceModal (Livrable N1)

```typescript
// Design: Modal plein écran avec carousel des secteurs
// Animations: Card flip pour révéler détails, confetti on select

interface SectorChoiceModalProps {
  visible: boolean;
  sectors: ChallengeSector[];
  onSelect: (sectorId: string) => void;
  onClose: () => void;
}

// Éléments visuels:
// - Header avec titre "Choisissez votre secteur"
// - Carousel horizontal des 4 secteurs
// - Chaque secteur: Grande icône, nom, description
// - Stats performance (optionnel)
// - Bouton "Confirmer" sticky en bas
```

---

### 5. Écrans Principaux

#### 5.1 ChallengeHubScreen (Découverte)

```
┌─────────────────────────────────────────┐
│  ← Programmes disponibles          🔍   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🏆 MES PROGRAMMES (2)           │   │
│  │ ──────────────────────────      │   │
│  │ [EnrollmentCard YEAH]           │   │
│  │ [EnrollmentCard DER-FJ]         │   │
│  │                                 │   │
│  │ + Voir tous mes programmes →    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🌟 PROGRAMMES RECOMMANDÉS       │   │
│  │ ──────────────────────────      │   │
│  │ [ChallengeCard FORCE-N] 🆕      │   │
│  │ [ChallengeCard WEECAP]          │   │
│  │ [ChallengeCard AGRO-TECH]       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📚 TOUS LES PROGRAMMES          │   │
│  │ ──────────────────────────      │   │
│  │ [Liste filtrable...]            │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### 5.2 ChallengeDetailScreen (Avant inscription)

```
┌─────────────────────────────────────────┐
│  ←                                      │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │     [BANNIÈRE DU PROGRAMME]     │   │
│  │          LOGO                   │   │
│  │     Mastercard Foundation       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  YEAH - Young Entrepreneur             │
│  Academy Hub                           │
│  ──────────────────────────────────    │
│                                         │
│  📝 DESCRIPTION                        │
│  Programme d'accompagnement pour       │
│  jeunes entrepreneurs agricoles...     │
│                                         │
│  📊 STRUCTURE                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ N1   │→│ N2   │→│ N3   │→│ N4   │  │
│  │Décou.│ │Idéa. │ │Démar.│ │Réuss.│  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│  🎯 SECTEURS                           │
│  [🌾] [🐄] [🏭] [🚜]                   │
│                                         │
│  🏆 LIVRABLES                          │
│  • Pitch structuré                     │
│  • Business Plan                       │
│  • Certificat Champion                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     REJOINDRE CE PROGRAMME      │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### 5.3 MyProgramsScreen (Tableau de bord)

```
┌─────────────────────────────────────────┐
│  ← Mes Programmes                       │
├─────────────────────────────────────────┤
│                                         │
│  PROGRAMME ACTIF                        │
│  ┌─────────────────────────────────┐   │
│  │ [Large EnrollmentCard YEAH]     │   │
│  │                                 │   │
│  │  Niveau 2 - Idéation            │   │
│  │  ████████░░░░░░ 8500 XP         │   │
│  │                                 │   │
│  │  Secteur: 🐄 Élevage            │   │
│  │                                 │   │
│  │  [    CONTINUER    ]            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  AUTRES PROGRAMMES                      │
│  ┌─────────────────────────────────┐   │
│  │ [EnrollmentCard DER-FJ]         │   │
│  │ Niveau 1 • 2000 XP   [Activer]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [EnrollmentCard FORCE-N]        │   │
│  │ Terminé ✓ • Champion Local 🏆   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  + Découvrir d'autres programmes →     │
│                                         │
└─────────────────────────────────────────┘
```

---

### 6. Design System Spécifique

#### Couleurs par défaut des Challenges
```typescript
// Chaque Challenge peut définir ses couleurs
// Fallback sur le design system existant

const CHALLENGE_COLORS = {
  yeah: {
    primary: '#FFBC40',    // Jaune Mastercard
    secondary: '#EB001B',  // Rouge Mastercard
    gradient: ['#FFBC40', '#FF8C00'],
  },
  'der-fj': {
    primary: '#00A651',    // Vert DER
    secondary: '#FDB913',
    gradient: ['#00A651', '#007A3D'],
  },
  'force-n': {
    primary: '#1E3A8A',    // Bleu Force-N
    secondary: '#10B981',
    gradient: ['#1E3A8A', '#3B82F6'],
  },
};
```

#### Animations clés
```typescript
// Animations Reanimated à implémenter

const ANIMATIONS = {
  // Déblocage niveau
  levelUnlock: {
    type: 'spring',
    damping: 12,
    stiffness: 100,
    effects: ['scale', 'glow', 'particles'],
  },

  // Gain XP
  xpGain: {
    type: 'timing',
    duration: 800,
    effects: ['countUp', 'pulse'],
  },

  // Choix secteur
  sectorSelect: {
    type: 'spring',
    effects: ['flip', 'confetti'],
  },

  // Génération livrable
  deliverableGenerate: {
    type: 'sequence',
    effects: ['typing', 'reveal', 'celebrate'],
  },
};
```

---

### 7. Services Backend (Firebase)

#### Collections Firestore

```typescript
// /challenges/{challengeId}
// Contient la config complète du Challenge

// /challenges/{challengeId}/cards/{cardId}
// Cartes pédagogiques du Challenge

// /users/{userId}/enrollments/{enrollmentId}
// Inscriptions de l'utilisateur

// /users/{userId}/enrollments/{enrollmentId}/deliverables/{type}
// Livrables générés
```

#### Règles de sécurité

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Challenges: Lecture publique
    match /challenges/{challengeId} {
      allow read: if true;
      allow write: if request.auth != null &&
                     get(/databases/$(database)/documents/admins/$(request.auth.uid)).exists;
    }

    // Enrollments: Lecture/écriture propriétaire uniquement
    match /users/{userId}/enrollments/{enrollmentId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

### 8. Migration depuis l'existant

#### Étapes de migration

1. **Phase 1: Infrastructure** (Semaine 1)
   - Créer les types TypeScript
   - Créer le store Zustand
   - Créer les services de base

2. **Phase 2: Composants UI** (Semaine 2)
   - Créer les composants challenges/
   - Adapter le design system

3. **Phase 3: Écrans** (Semaine 3)
   - ChallengeHubScreen
   - ChallengeDetailScreen
   - MyProgramsScreen

4. **Phase 4: Intégration Jeu** (Semaine 4)
   - Adapter GameEngine pour Challenge actif
   - Connecter progression XP
   - Implémenter livrables

5. **Phase 5: Migration Données** (Semaine 5)
   - Créer config YEAH en JSON
   - Migrer utilisateurs existants vers enrollments
   - Tests et validation

---

### 9. Points d'attention UX

1. **Onboarding Challenge**
   - Guider l'utilisateur vers son premier Challenge
   - Expliquer le concept multi-programmes
   - Animation de bienvenue personnalisée

2. **Basculement fluide**
   - Transition animée entre Challenges
   - Sauvegarde automatique de la progression
   - Indicateur visuel du Challenge actif partout

3. **Feedback progression**
   - Notifications locales pour déblocages
   - Célébrations visuelles pour milestones
   - Récap hebdomadaire de progression

4. **Offline-first**
   - Jouer sans connexion
   - Sync automatique au retour online
   - Indicateur de statut sync

---

## Prompt d'implémentation

### Prompt Principal (Copier-coller ce prompt)

```
Implémente le système de Challenges pour Startup Ludo.

## CONTEXTE
- App React Native / Expo avec Expo Router
- State: Zustand + persist (AsyncStorage)
- Backend: Firebase Firestore
- Animations: React Native Reanimated
- La section "CHALLENGE A LA UNE" existe déjà dans src/app/(tabs)/home.tsx (lignes 181-200) avec placeholder

## FICHIERS À LIRE EN PREMIER
1. docs/FICHE_TECHNIQUE_CHALLENGES.md - Spécifications complètes
2. src/app/(tabs)/home.tsx - Écran d'accueil avec section Challenge existante
3. src/styles/colors.ts, typography.ts, spacing.ts - Design system
4. src/components/ui/GradientBorder.tsx - Composant bordure utilisé
5. src/components/game/popups/DuelResultPopup.tsx - Pattern popup existant
6. src/stores/useGameStore.ts - Pattern Zustand existant

## DESIGN SYSTEM (OBLIGATOIRE)
- Primary: #FFBC40 (jaune/or)
- Background: #0C243E (bleu foncé)
- Card: rgba(0, 0, 0, 0.35)
- Title font: FONTS.title (LuckiestGuy_400Regular)
- Body font: FONTS.body (OpenSans)
- Utiliser DynamicGradientBorder et GradientBorder existants
- Animations Reanimated (FadeInDown, withSpring, etc.)

## ÉTAPES D'IMPLÉMENTATION

### Étape 1: Types (src/types/challenge.ts)
Créer tous les types TypeScript selon la fiche technique:
- Challenge, ChallengeLevel, ChallengeSubLevel
- ChallengeSector, ChallengeEnrollment
- ChallengeCard, ChallengeDeliverables

### Étape 2: Store Zustand (src/stores/useChallengeStore.ts)
- État: challenges, enrollments, activeChallengeId
- Actions: enrollInChallenge, setActiveChallenge, addXp, selectSector
- Persist avec AsyncStorage

### Étape 3: Données mock (src/data/challenges/yeah.ts)
Créer la config complète du Challenge YEAH:
- 4 niveaux, 16 sous-niveaux
- 4 secteurs (Production végétale, Élevage, Transformation, Services agricoles)
- XP: 1500/2500/5000/10000 par niveau

### Étape 4: Composant ChallengeHomeCard (src/components/challenges/ChallengeHomeCard.tsx)
Carte pour la section "CHALLENGE A LA UNE" de home.tsx:
- Si pas inscrit: afficher infos + bouton "Rejoindre"
- Si inscrit: afficher progression + bouton "Continuer"
- Utiliser DynamicGradientBorder existant
- Animation FadeInDown

### Étape 5: Intégrer dans home.tsx
Remplacer le placeholder par ChallengeHomeCard

### Étape 6: Écran ChallengeDetailScreen (src/app/(challenges)/[challengeId].tsx)
- Header avec bannière/logo du programme
- Structure des 4 niveaux
- Liste des secteurs
- Bouton inscription

### Étape 7: Écran MyProgramsScreen (src/app/(challenges)/my-programs.tsx)
- Liste mes inscriptions avec progression
- Basculer entre Challenges

### Étape 8: Modal SectorChoiceModal (src/components/challenges/SectorChoiceModal.tsx)
- Carousel des 4 secteurs
- Sélection avec animation
- Confirmation

## RÈGLES STRICTES
1. Utiliser EXACTEMENT les couleurs/fonts du design system
2. Composants avec React.memo
3. TypeScript strict (pas de any)
4. Animations fluides 60fps
5. Style cohérent avec home.tsx et les popups existants
6. Pas de nouvelles dépendances npm

## EXEMPLE DE RENDU ATTENDU

La carte Challenge sur home.tsx doit ressembler à:
┌─────────────────────────────────────────┐
│  [Logo YEAH]  YEAH                      │
│               Mastercard Foundation     │
│                                         │
│  ████████████░░░░░ Niveau 2 - 8500 XP  │
│  🐄 Élevage                             │
│                                         │
│  [      CONTINUER      ]                │
└─────────────────────────────────────────┘

Commence par l'étape 1 (types) et montre-moi le code complet.
```

### Prompts par étape (optionnel)

#### Prompt Étape 1 - Types
```
Crée src/types/challenge.ts avec tous les types TypeScript pour le système de Challenges.
Lis d'abord docs/FICHE_TECHNIQUE_CHALLENGES.md section "Modèles de Données".
```

#### Prompt Étape 4 - ChallengeHomeCard
```
Crée src/components/challenges/ChallengeHomeCard.tsx.
- Lis src/app/(tabs)/home.tsx pour voir le style existant (DynamicGradientBorder, styles.challengeCardContent, etc.)
- Si l'utilisateur n'est pas inscrit: afficher nom, description, bouton "Rejoindre ce programme"
- Si inscrit: afficher niveau actuel, barre XP, secteur choisi, bouton "Continuer"
- Utiliser FONTS.title pour les titres, FONTS.body pour le texte
- Couleur primary #FFBC40, fond rgba(0, 0, 0, 0.35)
```

#### Prompt Étape 6 - ChallengeDetailScreen
```
Crée src/app/(challenges)/[challengeId].tsx
- Header avec bannière gradient aux couleurs du Challenge
- Section "Structure" avec timeline des 4 niveaux
- Section "Secteurs" avec grille des 4 secteurs (icônes)
- Section "Livrables" (pitch, business plan, certificat)
- Bouton "Rejoindre ce programme" en bas (sticky)
- Utiliser ScrollView, GradientBorder, et le design system existant
```

---

## Checklist de validation

- [ ] Types Challenge créés et complets
- [ ] Store Zustand fonctionnel avec persist
- [ ] Service Firebase configuré
- [ ] ChallengeHubScreen implémenté
- [ ] ChallengeDetailScreen implémenté
- [ ] MyProgramsScreen implémenté
- [ ] Composants EnrollmentCard et ChallengeCard créés
- [ ] LevelProgress avec animations
- [ ] SectorChoiceModal fonctionnel
- [ ] PitchBuilderModal fonctionnel
- [ ] BusinessPlanModal fonctionnel
- [ ] Navigation configurée dans Expo Router
- [ ] Offline-first validé
- [ ] Migration YEAH testée
- [ ] Performances validées (60fps, pas de memory leaks)
