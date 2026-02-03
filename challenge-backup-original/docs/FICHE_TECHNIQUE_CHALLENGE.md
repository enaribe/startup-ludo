# FICHE TECHNIQUE - Systeme Challenge (Programme d'accompagnement)

## 1. VUE D'ENSEMBLE

Le systeme Challenge est un mode "Programme d'accompagnement" integre dans Startup Ludo. Il permet a des organisations (ex: Mastercard Foundation / YEAH) de creer des parcours educatifs en 4 niveaux, ou chaque niveau se joue via des parties de plateau Ludo (solo vs IA) et debouche sur un livrable entrepreneurial.

**Stack technique :** React Native + Expo SDK 55 + Expo Router 4 + Zustand 5 + immer + AsyncStorage

---

## 2. ARBORESCENCE DES FICHIERS

```
src/
  app/
    (challenges)/
      _layout.tsx            # Layout Stack, charge ALL_CHALLENGES au mount
      challenge-hub.tsx      # Ecran principal du programme (niveaux, progression, livrables)
      my-programs.tsx        # Liste "Mes programmes" (actif + autres inscriptions)
      [challengeId].tsx      # Detail d'un Challenge (curriculum, secteurs, inscription)
    (game)/
      challenge-game.tsx     # Setup pre-partie Challenge (config auto solo vs IA)
  components/
    challenges/
      index.ts               # Barrel export
      ChallengeHomeCard.tsx   # Carte programme pour ecran home/decouverte
      SectorChoiceModal.tsx   # Modal choix de secteur (apres Niveau 1)
      PitchBuilderModal.tsx   # Modal pitch guide en 5 etapes (Niveau 2)
      BusinessPlanModal.tsx   # Modal business plan simple/complet (Niveaux 3-4)
      FinalQuizModal.tsx      # Quiz final certification 16 questions (Niveau 4)
  data/
    challenges/
      index.ts               # Index: ALL_CHALLENGES, getChallengeById, getChallengeBySlug
      yeah.ts                 # Config complete YEAH (secteurs, niveaux, sous-niveaux)
      quizQuestions.ts        # 16 questions du quiz final (4 blocs de 4)
  stores/
    useChallengeStore.ts      # Store Zustand persiste (enrollments, progression, livrables)
  types/
    challenge.ts              # Tous les types TS du systeme Challenge
  config/
    progression.ts            # (MODIFICATION) Ajout CHALLENGE_XP_MULTIPLIERS + getChallengeXP()
```

**Modifications dans fichiers existants (a re-appliquer apres revert) :**
- `src/config/progression.ts` : ajouter `CHALLENGE_XP_MULTIPLIERS` et `getChallengeXP()`
- `src/stores/index.ts` : ajouter `export { useChallengeStore } from './useChallengeStore'`
- `src/types/index.ts` : ajouter `ChallengeContext` interface + `challengeContext?` dans `GameState` + `distanceTraveled` dans PawnState circuit

---

## 3. TYPES COMPLETS (src/types/challenge.ts)

### Challenge (programme)
```ts
interface Challenge {
  id: string;                    // "yeah"
  slug: string;                  // "yeah"
  name: string;                  // "YEAH"
  organization: string;          // "Mastercard Foundation"
  description: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;          // "#FFBC40"
  secondaryColor: string;        // "#EB001B"
  totalLevels: number;           // 4
  totalXpRequired: number;       // 76000
  levels: ChallengeLevel[];
  sectors: ChallengeSector[];
  rules: ChallengeRules;
  isActive: boolean;
  startDate: number | null;
  endDate: number | null;
  version: string;               // "v1"
  createdAt: number;
  updatedAt: number;
}
```

### ChallengeRules
```ts
interface ChallengeRules {
  sequentialProgression: boolean; // true (sous-niveaux dans l'ordre)
  captureEnabled: boolean;        // true
  maxEnrollmentsPerUser: number;  // 5
  allowLevelSkip: boolean;        // false
}
```

### ChallengeLevel
```ts
interface ChallengeLevel {
  id: string;                     // "yeah_level_1"
  challengeId: string;
  number: number;                 // 1-4
  name: string;                   // "Decouverte"
  description: string;
  xpRequired: number;             // 6000, 10000, 20000, 40000
  subLevels: ChallengeSubLevel[];
  deliverableType: DeliverableType;
  posture: string;                // "Curieux", "Porteur de projet", "Entrepreneur", "Champion"
  iconName: string;               // Ionicons: "compass-outline", "bulb-outline", etc.
}
```

### DeliverableType
```ts
type DeliverableType =
  | 'sector_choice'           // Niveau 1
  | 'pitch'                   // Niveau 2
  | 'business_plan_simple'    // Niveau 3
  | 'business_plan_full'      // Niveau 4 (+certificat)
  | 'custom';
```

### ChallengeSubLevel
```ts
interface ChallengeSubLevel {
  id: string;                     // "yeah_level_1_sub_1"
  levelId: string;
  number: number;                 // 1-4
  name: string;
  description: string;
  xpRequired: number;             // XP cumule pour debloquer le suivant
  cardCategories: string[];       // ["quiz", "opportunity", "funding"]
  rules: SubLevelRules;
}

interface SubLevelRules {
  captureEnabled: boolean;
  sequentialRequired: boolean;
}
```

### ChallengeSector
```ts
interface ChallengeSector {
  id: string;                     // "yeah_sector_vegetal"
  challengeId: string;
  name: string;                   // "Production vegetale"
  description: string;
  iconName: string;               // "leaf-outline"
  category: SectorCategory;       // "agriculture" | "services"
  homeNames: [string, string, string, string]; // Noms des 4 maisons du plateau
  color: string;                  // "#4CAF50"
}

type SectorCategory = 'agriculture' | 'technology' | 'services' | 'commerce' | 'artisanat';
```

### ChallengeEnrollment (inscription utilisateur)
```ts
interface ChallengeEnrollment {
  id: string;                     // "enrollment_{timestamp}_{random}"
  challengeId: string;
  userId: string;
  currentLevel: number;           // 1-4
  currentSubLevel: number;        // 1-4
  totalXp: number;
  xpByLevel: Record<number, number>; // { 1: 0, 2: 0, 3: 0, 4: 0 }
  selectedSectorId: string | null;
  deliverables: ChallengeDeliverables;
  status: EnrollmentStatus;       // 'active' | 'paused' | 'completed' | 'abandoned'
  championStatus: ChampionStatus | null; // 'local' | 'regional' | 'national'
  enrolledAt: number;
  lastPlayedAt: number;
  completedAt: number | null;
}
```

### ChallengeDeliverables
```ts
interface ChallengeDeliverables {
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
    generatedDocument: string;    // Document formate genere
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
```

### ChallengeCard (carte pedagogique)
```ts
interface ChallengeCard {
  id: string;
  challengeId: string;
  levelNumber: number;
  subLevelNumber: number;
  sectorId: string | null;        // null = generique
  type: ChallengeCardType;        // 'opportunity' | 'challenge' | 'quiz' | 'duel' | 'funding'
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  question?: string;
  options?: ChallengeCardOption[];
  correctAnswer?: number;
  xpReward: number;
  rarity: 'common' | 'rare' | 'legendary';
  createdAt: number;
}
```

### Helpers (fonctions utilitaires exportees depuis challenge.ts)
```ts
function getLevelProgress(currentXp: number, levelXpRequired: number): number  // -> 0-100%
function getChallengeProgress(totalXp: number, totalXpRequired: number): number // -> 0-100%
function isLevelUnlocked(levelNumber, currentLevel, xpByLevel, levels): boolean
function isSubLevelUnlocked(levelNumber, subLevelNumber, currentLevel, currentSubLevel, sequentialRequired): boolean
```

---

## 4. DONNEES YEAH (src/data/challenges/yeah.ts)

### 4 Secteurs
| ID | Nom | Icone | Categorie | Couleur | Maisons |
|---|---|---|---|---|---|
| yeah_sector_vegetal | Production vegetale | leaf-outline | agriculture | #4CAF50 | Semences, Irrigation, Recolte, Stockage |
| yeah_sector_elevage | Elevage | paw-outline | agriculture | #8B4513 | Alimentation, Sante, Reproduction, Commercialisation |
| yeah_sector_transformation | Transformation | construct-outline | agriculture | #FF9800 | Matieres premieres, Process, Qualite, Distribution |
| yeah_sector_services | Services agricoles | settings-outline | services | #2196F3 | Conseil, Equipement, Logistique, Digital |

### 4 Niveaux
| Niv | Nom | XP Requis | Livrable | Posture | Icone | Capture |
|---|---|---|---|---|---|---|
| 1 | Decouverte | 6 000 | Choix secteur | Curieux | compass-outline | Non |
| 2 | Ideation | 10 000 | Pitch | Porteur de projet | bulb-outline | Oui |
| 3 | Demarrage | 20 000 | BP Simple | Entrepreneur | rocket-outline | Oui |
| 4 | Reussite | 40 000 | BP Complet + Certif | Champion | trophy-outline | Oui |

**Total XP requis : 76 000**

### 16 Sous-niveaux (4 par niveau)

**Niveau 1 - Decouverte** (capture: non, sequentiel: oui)
| Sub | Nom | XP cumule | Cartes |
|---|---|---|---|
| 1 | Production vegetale | 1 500 | quiz, opportunity, funding |
| 2 | Elevage | 3 000 | quiz, opportunity, funding |
| 3 | Transformation | 4 500 | quiz, opportunity, funding |
| 4 | Services agricoles | 6 000 | quiz, opportunity, funding |

**Niveau 2 - Ideation** (capture: oui, sequentiel: oui)
| Sub | Nom | XP cumule | Cartes |
|---|---|---|---|
| 1 | Probleme / Besoin | 2 500 | quiz, challenge, opportunity |
| 2 | Solution | 5 000 | quiz, challenge, opportunity |
| 3 | Cible et Marche | 7 500 | quiz, challenge, duel |
| 4 | Faisabilite et Impact | 10 000 | quiz, challenge, duel |

**Niveau 3 - Demarrage** (capture: oui, sequentiel: oui)
| Sub | Nom | XP cumule | Cartes |
|---|---|---|---|
| 1 | Modele economique | 5 000 | quiz, challenge, funding |
| 2 | Organisation | 10 000 | quiz, challenge, opportunity |
| 3 | Finances | 15 000 | quiz, challenge, funding |
| 4 | Formalisation | 20 000 | quiz, challenge, duel |

**Niveau 4 - Reussite** (capture: oui, sequentiel: **non**)
| Sub | Nom | XP cumule | Cartes |
|---|---|---|---|
| 1 | Croissance | 10 000 | quiz, challenge, duel |
| 2 | Innovation | 20 000 | quiz, opportunity, duel |
| 3 | Impact | 30 000 | quiz, challenge, opportunity |
| 4 | Leadership | 40 000 | quiz, duel, funding |

### Multiplicateurs XP Challenge (dans progression.ts)
```ts
CHALLENGE_XP_MULTIPLIERS = {
  1: 10,   // Niveau 1 (6 000 XP) : x10 -> ~12 victoires
  2: 16,   // Niveau 2 (10 000 XP) : x16 -> ~12 victoires
  3: 30,   // Niveau 3 (20 000 XP) : x30 -> ~13 victoires
  4: 50,   // Niveau 4 (40 000 XP) : x50 -> ~16 victoires
};
```

---

## 5. STORE (src/stores/useChallengeStore.ts)

Store Zustand avec middlewares `persist` (AsyncStorage) + `immer`.

### State
```ts
{
  challenges: Challenge[];          // Tous les programmes charges
  enrollments: ChallengeEnrollment[]; // Inscriptions utilisateur
  activeChallengeId: string | null;   // Programme actif selectionne
  isLoading: boolean;
  error: string | null;
}
```

### Persistence
Sauvegarde uniquement `enrollments` et `activeChallengeId` dans AsyncStorage (cle: `challenge-storage`). Les `challenges` sont recharges depuis les donnees au mount.

### Actions detaillees

**Challenges :**
- `setChallenges(challenges)` : charge la liste complete
- `addChallenge(challenge)` : ajoute si pas deja present
- `getChallengeById(id)` : retourne Challenge | undefined
- `getActiveChallenge()` : retourne le Challenge actif

**Enrollments :**
- `enrollInChallenge(challengeId, userId)` : cree une inscription (currentLevel=1, currentSubLevel=1, xpByLevel={1:0,2:0,3:0,4:0})
- `getEnrollmentForChallenge(challengeId)` : trouve l'inscription
- `getActiveEnrollment()` : inscription du challenge actif
- `getUserEnrollments(userId)` : toutes les inscriptions
- `setActiveChallenge(challengeId)` : change le programme actif
- `updateEnrollmentStatus(enrollmentId, status)` : met a jour le statut

**Progression :**
- `addXp(enrollmentId, amount)` : ajoute XP au total ET au xpByLevel du niveau courant
- `setCurrentLevel(enrollmentId, level)` : change de niveau (reset currentSubLevel a 1)
- `setCurrentSubLevel(enrollmentId, subLevel)` : change de sous-niveau
- `checkAndUnlockNextLevel(enrollmentId)` : verifie XP + tous sous-niveaux completes -> passe au niveau suivant (ou status='completed' si niveau 4 termine)
- `checkAndUnlockNextSubLevel(enrollmentId)` : verifie XP >= subLevel.xpRequired -> passe au sous-niveau suivant

**Secteur + Livrables :**
- `selectSector(enrollmentId, sectorId)` : sauvegarde le choix de secteur
- `savePitch(enrollmentId, pitch)` : sauvegarde le pitch complet (5 champs + document genere)
- `saveBusinessPlan(enrollmentId, type, content, document)` : sauvegarde BP simple ou complet
- `setChampionStatus(enrollmentId, status)` : attribue le statut champion

**Selectors :**
- `selectActiveChallenge` : selector pour le challenge actif
- `selectActiveEnrollment` : selector pour l'inscription active
- `selectIsEnrolled(challengeId)` : selector pour verifier si inscrit

---

## 6. ECRANS

### 6.1 _layout.tsx (Layout Challenges)
- Stack Expo Router, fond `#0C243E`
- Au mount : si `challenges.length === 0`, charge `ALL_CHALLENGES` via `setChallenges()`

### 6.2 [challengeId].tsx (Detail programme)
- **Route :** `/(challenges)/[challengeId]`
- **Hero banner** avec nom, org, description, stats rapides
- **Timeline des 4 niveaux** avec livrables
- **Grille 2 colonnes des 4 secteurs** (nom, icone, couleur, maisons)
- **Liste des livrables** par niveau
- **Metriques :** 4 niveaux, 16 etapes, 4 secteurs, 1 certificat
- **Bouton inscription** : "Rejoindre" (si pas inscrit) ou "Continuer" (si inscrit)
- Appelle `enrollInChallenge()` a l'inscription puis redirige vers challenge-hub

### 6.3 challenge-hub.tsx (Hub principal)
- **Route :** `/(challenges)/challenge-hub`
- **Hero Card :** niveau actuel, XP, progression, secteur selectionne
- **Liste niveaux expandable :** chaque niveau affiche ses 4 sous-niveaux avec barres de progression
- **Section livrables :** 4 livrables avec etat verrouille/deverrouille/complete
- **Logique de verrouillage :**
  - Secteur : `currentLevel >= 2` (Niveau 1 complete)
  - Pitch : `currentLevel >= 3` (Niveau 2 complete)
  - BP Simple : `currentLevel >= 4` (Niveau 3 complete)
  - BP Complet : `xpByLevel[4] >= 40000` ET BP Simple termine
- **Etat verrouille :** icone lock-closed, opacity 0.45, texte muted, badge "NIVEAU X", disabled
- **Etat deverrouille :** ouvre le modal correspondant (SectorChoiceModal, PitchBuilderModal, BusinessPlanModal, FinalQuizModal)
- **Bouton "JOUER"** : redirige vers `/(game)/challenge-game`
- **Animations :** FadeInDown stagger, ZoomIn pour icones, springify

### 6.4 my-programs.tsx (Mes programmes)
- **Route :** `/(challenges)/my-programs`
- **Carte programme actif** : grande carte avec progression, niveau, secteur
- **Autres programmes** : cartes compactes avec bouton "Activer"
- **Etat vide** si aucune inscription
- Utilise `EnrollmentCard` (composant interne)
- Bouton "Decouvrir" pour trouver d'autres programmes

### 6.5 challenge-game.tsx (Setup partie)
- **Route :** `/(game)/challenge-game?challengeId=xxx`
- **Carte Challenge Info :** nom, org, niveau actuel, sous-niveau, barre XP, secteur
- **Config automatique :** Solo vs IA, joueur vert, IA bleu
- **Types de cartes** du sous-niveau actuel affiches
- **Info XP** : "Les XP gagnes seront comptabilises dans ta progression"
- **Bouton "LANCER LA PARTIE"** : appelle `initGame('solo', edition, players, challengeContext)` puis navigue vers `/(game)/play/${gameId}`
- **Edition** determinee par secteur : agriculture -> 'agriculture', services -> 'services', sinon 'classic'
- **ChallengeContext** passe au jeu :
  ```ts
  { challengeId, enrollmentId, levelNumber, subLevelNumber, sectorId }
  ```

---

## 7. COMPOSANTS

### 7.1 ChallengeHomeCard
- **Usage :** ecran home / decouverte
- **Props :** `challenge`, `enrollment?`, `onEnroll?`, `onContinue?`
- **2 etats :** inscrit (progression + "Continuer") / non-inscrit (description + "Rejoindre")
- **Style :** DynamicGradientBorder avec `challenge.primaryColor`

### 7.2 SectorChoiceModal
- **Props :** `visible`, `sectors: ChallengeSector[]`, `onSelect(sectorId)`, `onClose`, `challengeName?`
- **Badge :** "NIVEAU 1 COMPLETE"
- **Titre :** "Choisissez votre secteur"
- **4 cartes secteur :** icone, nom, description, tags maisons, radio button
- **Selection :** un secteur a la fois (radio)
- **2 phases :**
  1. Selection : scroll des cartes, bouton "VALIDER MON CHOIX" (ou hint "Selectionnez un secteur")
  2. Confirmation : grande icone, nom du secteur, warning "choix definitif", boutons "CONFIRMER" (vert) + "Modifier mon choix"
- **Animations :** FadeInDown stagger 200+index*100ms, ZoomIn pour icones, springify

### 7.3 PitchBuilderModal
- **Props :** `visible`, `onClose`, `onValidate(pitch)`, `initialData?`, `mode: 'create'|'view'|'edit'`, `sectorName?`
- **5 etapes guidees :**
  1. Probleme/Besoin (min 20 chars, max 500)
  2. Solution (min 20 chars, max 500)
  3. Marche cible (min 20 chars, max 500)
  4. Faisabilite (min 20 chars, max 500)
  5. Impact social/environnemental (min 20 chars, max 500)
- **Etape 6 = Recap :** affiche toutes les reponses avant validation
- **Barre de progression :** steps 1-5 avec indicateur
- **Navigation :** Previous / Next avec validation a chaque etape
- **Generation :** formate un document pitch structure a la validation
- **Mode view :** lecture seule du pitch existant

### 7.4 BusinessPlanModal
- **Props :** `visible`, `onClose`, `onValidate(bp)`, `type: 'simple'|'full'`, `initialData?`, `mode`, `sectorName?`, `pitchData?`, `bpSimpleData?`
- **BP Simple (4 etapes) :**
  1. Modele economique
  2. Organisation equipe
  3. Plan financier
  4. Formalites administratives
- **BP Complet (4 etapes) :** (inclut donnees BP Simple)
  1. Strategie de croissance
  2. Innovation
  3. Impact mesurable
  4. Developpement leadership
- **Flow :** Recap (donnees existantes) -> Questions -> Document genere
- **Recap initial :** affiche secteur + pitch + BP Simple (si complet)
- **Min 20 chars par reponse**

### 7.5 FinalQuizModal
- **Props :** `visible`, `onClose`, `onPass(certificate)`, `enrollment`, `challenge`
- **16 questions** en 4 blocs (Decouverte, Ideation, Demarrage, Reussite)
- **Seuil de reussite :** 75% (12/16 = 9 points minimum)
- **Phase quiz :** question par question avec feedback correct/incorrect
- **Phase resultats :** score total + scores par bloc
- **Reussite :**
  - Animation trophee
  - Attribution "Champion Local"
  - Generation certificat
  - Appel `setChampionStatus(enrollmentId, 'local')` + `saveBusinessPlan(type:'full',...)`
- **Echec :** message + option "Reessayer"

---

## 8. QUIZ FINAL (src/data/challenges/quizQuestions.ts)

16 questions, 4 blocs de 4, chaque question a 4 options (une correcte).

**Bloc 1 - Decouverte (4Q) :** validation idee, etude de marche, secteurs, exploration
**Bloc 2 - Ideation (4Q) :** proposition de valeur, pitch, probleme, marche cible
**Bloc 3 - Demarrage (4Q) :** modele economique, plan financier, formalisation, seuil rentabilite
**Bloc 4 - Reussite (4Q) :** croissance, impact social, innovation, leadership

```ts
export const QUIZ_PASS_THRESHOLD = 0.75; // 75% = 12/16 minimum
```

---

## 9. INTEGRATION AVEC LE JEU (types/index.ts)

### ChallengeContext (ajout dans types/index.ts)
```ts
interface ChallengeContext {
  challengeId: string;
  enrollmentId: string;
  levelNumber: number;
  subLevelNumber: number;
  sectorId: string | null;
}
```

### GameState (modification)
```ts
interface GameState {
  // ... existant ...
  challengeContext?: ChallengeContext; // Present si partie lancee depuis le hub Challenge
}
```

### PawnState (modification)
```ts
type PawnState =
  | { status: 'home'; slotIndex: number }
  | { status: 'circuit'; position: number; distanceTraveled: number } // distanceTraveled ajoute
  | { status: 'final'; position: number }
  | { status: 'finished' };
```

### initGame (modification dans useGameStore)
La fonction `initGame()` accepte un parametre optionnel `challengeContext` :
```ts
initGame: (mode, edition, players, challengeContext?) => {
  // ... creation du GameState ...
  game.challengeContext = challengeContext;
}
```

---

## 10. FLOW UTILISATEUR COMPLET

```
1. Home -> "Programme" -> /(challenges)/[challengeId]
   -> Voir detail du programme YEAH
   -> Bouton "Rejoindre" -> enrollInChallenge()
   -> Redirection vers challenge-hub

2. challenge-hub (ecran principal)
   -> Voir Niveau 1, Sous-niveau 1 "Production vegetale"
   -> Bouton "JOUER" -> /(game)/challenge-game
   -> Config auto: Solo vs IA
   -> "LANCER LA PARTIE" -> initGame() avec challengeContext
   -> /(game)/play/[gameId] -> Partie de plateau Ludo

3. Fin de partie -> XP gagnes * multiplicateur -> addXp()
   -> checkAndUnlockNextSubLevel() / checkAndUnlockNextLevel()
   -> Retour au challenge-hub avec progression mise a jour

4. Apres 4 sous-niveaux du Niveau 1 (6000 XP) :
   -> Livrable "Choix de secteur" se deverrouille
   -> SectorChoiceModal -> choix parmi 4 secteurs -> selectSector()
   -> currentLevel passe a 2

5. Apres Niveau 2 (10 000 XP) -> PitchBuilderModal (5 etapes)
   -> savePitch() -> currentLevel passe a 3

6. Apres Niveau 3 (20 000 XP) -> BusinessPlanModal type='simple' (4 etapes)
   -> saveBusinessPlan('simple',...) -> currentLevel passe a 4

7. Apres Niveau 4 (40 000 XP) + BP Simple fait :
   -> FinalQuizModal (16 questions, 75% pour reussir)
   -> Si reussi : Champion Local + certificat
   -> BusinessPlanModal type='full' (4 etapes, inclut donnees precedentes)
   -> saveBusinessPlan('full',...) + setChampionStatus('local')
   -> Programme complete !
```

---

## 11. DESIGN SYSTEM UTILISE

- **Composants UI :** `GameButton` (variants: yellow/green/blue/red), `DynamicGradientBorder` (borderRadius, fill), `Modal` (size: 'full'/'medium'), `RadialBackground`
- **Couleurs :** COLORS.background=#0C243E, COLORS.primary=#FFBC40, COLORS.card, COLORS.white, COLORS.textSecondary, COLORS.textMuted, COLORS.success, COLORS.warning, COLORS.info, COLORS.error, COLORS.infoLight
- **Fonts :** FONTS.title (LuckiestGuy), FONTS.body/bodyMedium/bodySemiBold/bodyBold (OpenSans)
- **Tailles :** FONT_SIZES.xs/sm/base/md/lg/xl/2xl/3xl
- **Spacing :** SPACING[1..8] (4,8,12,16,20,24,32,40)
- **Radius :** BORDER_RADIUS.sm/md/lg/xl/full
- **Animations :** FadeIn, FadeInDown, FadeInUp, ZoomIn, .delay(n), .duration(n), .springify()

---

## 12. RESPONSIVITE DU PLATEAU (Tablettes + Rotation)

### Probleme initial
Le plateau etait plafonne a 400px (`Math.min(SCREEN_WIDTH - 16, 400)`) et utilisait `Dimensions.get('window')` a l'initialisation du module (valeur statique, ne reagit pas a la rotation).

### Solution : 2 fichiers modifies

#### 12.1 GameBoard/index.tsx

**Avant :**
```ts
import { Dimensions } from 'react-native';
const SCREEN_WIDTH = Dimensions.get('window').width;
// ...
const boardSize = Math.min(SCREEN_WIDTH - 16, 400); // plafond 400px
```

**Apres :**
```ts
import { useWindowDimensions } from 'react-native';
// ...
const { width: windowWidth } = useWindowDimensions(); // reactif a la rotation
const boardSize = size ?? Math.min(windowWidth - 16, 400); // parent peut forcer la taille
```

**Changements :**
1. Remplacer `Dimensions` (statique) par `useWindowDimensions()` (reactif, re-render a chaque rotation)
2. Supprimer la constante module-level `SCREEN_WIDTH`
3. Ajouter une prop `size?: number` a l'interface `GameBoardProps` — si fournie, le parent controle la taille du plateau
4. Fallback : `size ?? Math.min(windowWidth - 16, 400)`

#### 12.2 play/[gameId].tsx (layout responsif)

**Ajout de detection :**
```ts
const { width: windowWidth, height: windowHeight } = useWindowDimensions();
const isLandscape = windowWidth > windowHeight;
const isTablet = Math.min(windowWidth, windowHeight) >= 600;
```

**Calcul dynamique de la taille du plateau :**
```ts
const headerHeight = insets.top + 72;
const sideColumnWidth = isTablet ? 180 : 130;
let computedBoardSize: number;

if (isLandscape) {
  // Paysage : le plateau est contraint par la hauteur, joueurs sur les cotes
  const availableHeight = windowHeight - headerHeight - insets.bottom - SPACING[4] * 2;
  const availableWidth = windowWidth - sideColumnWidth * 2 - SPACING[3] * 4;
  computedBoardSize = Math.min(availableHeight, availableWidth);
} else {
  // Portrait : le plateau remplit la largeur, contraint par les PlayerCards haut/bas
  const playerRowHeight = isTablet ? 72 : 60;
  const verticalChrome = headerHeight + insets.bottom + playerRowHeight * 2 + SPACING[4] * 2;
  const availableHeight = windowHeight - verticalChrome;
  const availableWidth = windowWidth - SPACING[2] * 2 - SPACING[1] * 2;
  computedBoardSize = Math.min(availableWidth, availableHeight);
}
// Minimum jouable
computedBoardSize = Math.max(computedBoardSize, 280);
```

**Layout conditionnel Portrait vs Paysage :**

**Portrait (phones + tablettes verticales) :**
```
  [Yellow]  [Blue]     <- playersRow (haut)
  [   PLATEAU    ]     <- boardContainer
  [Green]   [Red]      <- playersRow (bas)
```

**Paysage (tablettes horizontales) :**
```
  [Yellow]              [Blue]
  [Green]  [PLATEAU]    [Red]
           <- landscapeContainer (row) ->
```

**Styles ajoutes :**
```ts
landscapeContainer: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: SPACING[3],
  gap: SPACING[2],
},
landscapeSide: {
  justifyContent: 'center',
  gap: SPACING[2],
},
landscapePlayerSlot: {
  width: '100%',
},
```

**Helper renderPlayerCard :**
Extraction d'une fonction `renderPlayerCard(playerColor: PlayerColor)` pour eviter 4x copier-coller identique. Chaque appel rend un `<PlayerCard>` configure.

#### 12.3 CenterZone.tsx (mise a l'echelle proportionnelle)

Les indicateurs de pions termines etaient en taille fixe (28px). Modifie pour etre proportionnels :
```ts
// Avant
const indicatorSize = 28; // fixe

// Apres
const indicatorSize = Math.max(size * 0.2, 22); // proportionnel a la zone centrale, min 22px
```
Applique a `width`, `height`, `borderRadius`, et `fontSize` de chaque indicateur.

#### 12.4 Points cles

- **Tous les composants enfants** (PathCell, HomeZone, Pawn, CenterZone) utilisent deja des tailles relatives a `cellSize` et `boardPadding` — ils s'adaptent automatiquement
- **`useWindowDimensions()`** declenche un re-render a chaque rotation d'ecran
- **Le plateau n'a plus de plafond fixe** — sa taille est calculee en fonction de l'espace disponible
- **`isTablet`** detecte via `Math.min(width, height) >= 600` (seuil standard)
- **En paysage** les PlayerCards passent sur les cotes gauche/droite au lieu de haut/bas

---

## 13. NOTES IMPORTANTES POUR REIMPLEMENTATION

1. **useChallengeStore doit etre persiste** via AsyncStorage (seuls enrollments + activeChallengeId)
2. **Les challenges sont charges depuis les donnees** (pas persistes) au mount de _layout.tsx
3. **Le quiz final a 16 questions codees en dur** dans quizQuestions.ts
4. **Les multiplicateurs XP** vont dans `src/config/progression.ts` (pas dans le store)
5. **initGame() doit accepter un `challengeContext`** optionnel pour lier partie et programme
6. **PawnState.circuit doit avoir `distanceTraveled`** pour le calcul de progression dans les parties challenge
7. **Chaque modal gere son propre state** (etapes, validation) — pas de state partage
8. **Le mode Challenge est toujours Solo vs IA** — joueur Vert, IA Bleu
9. **L'edition du jeu depend du secteur** : agriculture, services, ou classic
10. **Le verrouillage des livrables** est gere dans challenge-hub.tsx avec des booleens derives (`isSectorUnlocked`, `isPitchUnlocked`, `isBPSimpleUnlocked`, `isBPFullUnlocked`)
