# PROMPT - Compléter le Système de Challenges (Parcours)

## CONTEXTE

Tu travailles sur **Startup Ludo**, une app React Native / Expo Router (SDK 55). Un système de **Challenges** (parcours d'accompagnement entrepreneurial) a été partiellement implémenté. Tu dois **compléter uniquement ce qui manque** sans toucher aux fichiers déjà fonctionnels.

### Stack technique
- React Native 0.83 / Expo SDK 55 / Expo Router 4
- Zustand 5 + immer + persist (AsyncStorage)
- React Native Reanimated 4
- TypeScript strict
- Ionicons pour les icônes
- Composants UI existants : `RadialBackground`, `DynamicGradientBorder`, `GradientBorder`, `GameButton`

---

## FICHIERS À LIRE EN PREMIER (OBLIGATOIRE)

Lis ces fichiers **avant de coder** pour comprendre l'existant :

1. `docs/CHALLENGE_DESIGN_SYSTEM.md` — Design system complet (couleurs, fonts, animations, patterns)
2. `docs/FICHE_TECHNIQUE_CHALLENGES.md` — Spécifications techniques du système
3. `challengdesc.md` — Description fonctionnelle détaillée (livrables, flux, progression)
4. `src/types/challenge.ts` — Types déjà définis (Challenge, Enrollment, Deliverables, etc.)
5. `src/stores/useChallengeStore.ts` — Store Zustand complet avec toutes les actions
6. `src/data/challenges/yeah.ts` — Configuration complète du Challenge YEAH
7. `src/app/(challenges)/challenge-hub.tsx` — Écran Hub de progression (DÉJÀ FAIT)
8. `src/app/(challenges)/my-programs.tsx` — Écran Mes Programmes (DÉJÀ FAIT)
9. `src/components/challenges/ChallengeHomeCard.tsx` — Carte accueil (DÉJÀ FAIT)
10. `src/components/challenges/SectorChoiceModal.tsx` — Modal choix secteur N1 (DÉJÀ FAIT)
11. `src/app/(game)/challenge-game.tsx` — Config partie Challenge (DÉJÀ FAIT)
12. `src/app/(tabs)/home.tsx` — Écran d'accueil (pour intégration)
13. `src/styles/colors.ts`, `src/styles/typography.ts`, `src/styles/spacing.ts` — Design tokens

---

## CE QUI EXISTE DÉJÀ (NE PAS TOUCHER)

| Fichier | Statut |
|---------|--------|
| `src/types/challenge.ts` | ✅ Complet |
| `src/stores/useChallengeStore.ts` | ✅ Complet (actions savePitch, saveBusinessPlan, selectSector, addXp, etc.) |
| `src/data/challenges/yeah.ts` + `index.ts` | ✅ Complet (4 niveaux, 4 secteurs, 16 sous-niveaux) |
| `src/app/(challenges)/_layout.tsx` | ✅ Stack navigator |
| `src/app/(challenges)/challenge-hub.tsx` | ✅ Progression, niveaux, sous-niveaux, livrables |
| `src/app/(challenges)/my-programs.tsx` | ✅ Liste programmes actifs/inactifs |
| `src/components/challenges/ChallengeHomeCard.tsx` | ✅ Carte accueil inscrit/non-inscrit |
| `src/components/challenges/SectorChoiceModal.tsx` | ✅ Carousel secteurs Niveau 1 |
| `src/app/(game)/challenge-game.tsx` | ✅ Config partie avant lancement |
| `src/components/challenges/index.ts` | ✅ Exports |

---

## CE QUI MANQUE ET DOIT ÊTRE IMPLÉMENTÉ

### 1. Écran Détail Challenge `src/app/(challenges)/[challengeId].tsx`

**But** : Page de présentation d'un Challenge AVANT inscription.

**Contenu** :
- Header avec bannière gradient aux couleurs du Challenge (`primaryColor`, `secondaryColor`)
- Logo + nom du programme + organisation
- Description du programme
- Section "Structure" : timeline visuelle des 4 niveaux (nom, posture, icône, XP requis)
- Section "Secteurs" : grille des 4 secteurs (icône + nom + couleur)
- Section "Livrables" : liste (Choix secteur → Pitch → BP simplifié → BP complet + Certificat)
- Statistiques : "4 niveaux", "16 sous-niveaux", "X secteurs", "Certificat"
- Bouton "REJOINDRE CE PROGRAMME" sticky en bas → appelle `enrollInChallenge(challengeId, userId)` puis navigue vers `challenge-hub`
- Si déjà inscrit : bouton "CONTINUER" qui navigue vers `challenge-hub`

**Pattern** : Utiliser `RadialBackground`, `DynamicGradientBorder`, `ScrollView`, `useSafeAreaInsets`, animations `FadeInDown` staggerées.

---

### 2. Modal Formulaire Pitch `src/components/challenges/PitchBuilderModal.tsx`

**But** : Formulaire assisté en 5 étapes pour générer le livrable du Niveau 2 (Idéation).

**Déclenchement** : Quand le joueur a complété les 4 sous-niveaux du Niveau 2 (10 000 XP atteints). Afficher automatiquement ou via bouton dans le hub.

**Flux multi-étapes** :
1. **Étape 1 - Problème** : "Quel problème résolvez-vous ?"
   - TextInput multiligne (placeholder: "Décrivez le problème que votre projet résout...")
   - Indication du sous-niveau associé : "2.1 Problème / Besoin"
2. **Étape 2 - Solution** : "Quelle est votre solution ?"
   - TextInput multiligne (placeholder: "Décrivez votre solution...")
   - Indication : "2.2 Solution"
3. **Étape 3 - Cible** : "Qui sont vos clients ?"
   - TextInput multiligne (placeholder: "Décrivez votre clientèle cible...")
   - Indication : "2.3 Cible et Marché"
4. **Étape 4 - Viabilité** : "Comment votre projet est-il viable ?"
   - TextInput multiligne (placeholder: "Expliquez votre modèle économique...")
   - Indication : "2.4 Faisabilité et Impact"
5. **Étape 5 - Impact** : "Quel impact visez-vous ?"
   - TextInput multiligne (placeholder: "Décrivez l'impact social/environnemental visé...")

**UI par étape** :
- Header : numéro d'étape (1/5, 2/5...) + barre de progression horizontale
- Titre de la question en `FONTS.title`
- Sous-titre avec le sous-niveau associé
- TextInput avec style glassmorphism (fond `rgba(0,0,0,0.3)`, bordure `rgba(255,255,255,0.1)`)
- Compteur de caractères
- Bouton "SUIVANT" (désactivé si champ vide, min 20 caractères)
- Bouton "PRÉCÉDENT" (sauf étape 1)

**Dernière étape (récapitulatif)** :
- Afficher un résumé de toutes les réponses dans une fiche structurée
- Titre : "VOTRE FICHE PITCH"
- Chaque section avec son titre + réponse
- Bouton "VALIDER MON PITCH" → appelle `savePitch(enrollmentId, { problem, solution, target, viability, impact, generatedDocument, completedAt })`
- Le `generatedDocument` est une string formatée qui combine toutes les réponses en document structuré

**Animation** : Transition entre étapes avec `SlideInRight` / `SlideOutLeft`

**Props** :
```typescript
interface PitchBuilderModalProps {
  visible: boolean;
  enrollmentId: string;
  challengeId: string;
  sectorName?: string;
  onComplete: () => void;
  onClose: () => void;
}
```

---

### 3. Modal Business Plan Simplifié `src/components/challenges/BusinessPlanModal.tsx`

**But** : Formulaire de confirmation et complétion pour le livrable du Niveau 3 (Démarrage).

**Déclenchement** : Quand le joueur a complété les 4 sous-niveaux du Niveau 3 (20 000 XP).

**Flux** :
1. **Écran de synthèse** : Récapitule les données des niveaux précédents :
   - Secteur choisi (Niveau 1) — affiché avec badge couleur
   - Pitch (Niveau 2) — résumé des 5 réponses
   - Titre : "Votre parcours jusqu'ici"

2. **Questions complémentaires Niveau 3** (formulaire) :
   - "Quel est votre modèle économique ?" (sous-niveau 3.1)
   - "Comment organisez-vous votre équipe ?" (sous-niveau 3.2)
   - "Quel est votre plan financier ?" (sous-niveau 3.3)
   - "Quelles formalités avez-vous identifiées ?" (sous-niveau 3.4)

3. **Génération du BP** :
   - Combiner : secteur + pitch + réponses N3
   - Afficher une vue "document" stylisée
   - Bouton "VALIDER MON BUSINESS PLAN"
   - Appelle `saveBusinessPlan(enrollmentId, 'simple', content, generatedDocument)`

**Props** :
```typescript
interface BusinessPlanModalProps {
  visible: boolean;
  enrollmentId: string;
  challengeId: string;
  type: 'simple' | 'full';
  existingData?: {
    sectorName?: string;
    pitch?: ChallengeDeliverables['pitch'];
    businessPlanSimple?: ChallengeDeliverables['businessPlanSimple'];
  };
  onComplete: () => void;
  onClose: () => void;
}
```

---

### 4. Modal Business Plan Complet + Quiz Global `src/components/challenges/FinalQuizModal.tsx`

**But** : Quiz global de validation + génération du BP complet + certificat (Niveau 4).

**Déclenchement** : Quand le joueur a complété les 4 sous-niveaux du Niveau 4 (40 000 XP).

**Flux** :
1. **Introduction** : "Quiz Final - Testez votre maîtrise globale"
   - Explication : 4 blocs de questions (un par niveau)
   - Seuil minimum : 75% de bonnes réponses

2. **Quiz - 4 blocs** (4 questions chacun = 16 questions total) :
   - Bloc 1 (Découverte) : Questions sur les bases entrepreneuriales
   - Bloc 2 (Idéation) : Questions sur le pitch et la proposition de valeur
   - Bloc 3 (Démarrage) : Questions sur le business plan et l'organisation
   - Bloc 4 (Réussite) : Questions sur la croissance et le leadership
   - Chaque question : texte + 4 options + 1 bonne réponse
   - Feedback immédiat (vert/rouge) après chaque réponse
   - Score affiché en temps réel

3. **Résultat du Quiz** :
   - Si réussi (≥75%) :
     - Animation de célébration
     - Affichage du BP complet enrichi (secteur + pitch + BP simple + réponses N4)
     - Attribution statut Champion (local par défaut)
     - Badge Champion avec animation
     - Bouton "VOIR MON CERTIFICAT"
   - Si échoué (<75%) :
     - Message d'encouragement
     - Score détaillé par bloc
     - Bouton "RÉESSAYER"

4. **Écran Certificat** :
   - Design certificate-like avec bordures dorées
   - Nom du joueur
   - Nom du Challenge
   - Statut Champion attribué
   - Date de complétion
   - Bouton "PARTAGER" (placeholder pour futur)
   - Bouton "TERMINER"

**Données du quiz** (à hardcoder pour YEAH) :
```typescript
const FINAL_QUIZ_QUESTIONS = [
  // Bloc 1 - Découverte
  { question: "Quel est le premier pas pour valider une idée d'entreprise ?", options: [...], correct: 0 },
  // ... 15 autres questions
];
```

**Props** :
```typescript
interface FinalQuizModalProps {
  visible: boolean;
  enrollmentId: string;
  challengeId: string;
  existingData: {
    sectorName: string;
    pitch: ChallengeDeliverables['pitch'];
    businessPlanSimple: ChallengeDeliverables['businessPlanSimple'];
  };
  onComplete: (champion: ChampionStatus) => void;
  onClose: () => void;
}
```

---

### 5. Intégration des modals dans le Hub `challenge-hub.tsx`

**Modifier** `src/app/(challenges)/challenge-hub.tsx` pour :

1. **Rendre les livrables cliquables** : Chaque item dans la section "LIVRABLES" doit ouvrir le modal correspondant quand les conditions sont remplies :
   - Choix secteur → `SectorChoiceModal` (déjà fait)
   - Pitch → `PitchBuilderModal` (quand Niveau 2 complété)
   - BP Simple → `BusinessPlanModal` type='simple' (quand Niveau 3 complété)
   - BP Complet → `FinalQuizModal` (quand Niveau 4 complété)

2. **Détection automatique** : Quand un niveau est complété et le livrable n'est pas encore fait, afficher un badge "NOUVEAU" pulsant sur le livrable correspondant et proposer automatiquement l'ouverture du modal.

3. **Ajouter les états des modals** :
```typescript
const [showPitchModal, setShowPitchModal] = useState(false);
const [showBPModal, setShowBPModal] = useState(false);
const [showFinalQuizModal, setShowFinalQuizModal] = useState(false);
```

---

### 6. Chargement initial des Challenges `src/app/(challenges)/_layout.tsx`

**Modifier** le layout pour charger automatiquement les challenges au montage :

```typescript
import { useEffect } from 'react';
import { useChallengeStore } from '@/stores';
import { getAllChallenges } from '@/data/challenges';

export default function ChallengesLayout() {
  const setChallenges = useChallengeStore((state) => state.setChallenges);
  const challenges = useChallengeStore((state) => state.challenges);

  useEffect(() => {
    if (challenges.length === 0) {
      setChallenges(getAllChallenges());
    }
  }, []);

  // ... rest of layout
}
```

Faire la même chose dans `src/app/(tabs)/home.tsx` pour que le `ChallengeHomeCard` ait accès aux données.

---

### 7. Sync XP retour de partie `src/app/(game)/play/[gameId].tsx` ou `results/[gameId].tsx`

**Ajouter** la logique pour que l'XP gagnée pendant une partie en mode Challenge remonte vers l'enrollment :

- Après une partie Challenge, dans l'écran de résultats :
  1. Récupérer le `challengeContext` du `GameStore`
  2. Calculer l'XP gagnée pendant la partie
  3. Appeler `addXp(enrollmentId, xpGained)`
  4. Appeler `checkAndUnlockNextSubLevel(enrollmentId)` puis `checkAndUnlockNextLevel(enrollmentId)`
  5. Si un niveau a été débloqué et que le livrable est dû, déclencher le modal correspondant

---

## DESIGN SYSTEM OBLIGATOIRE

```typescript
// Couleurs
COLORS.primary = '#FFBC40'          // Jaune/Or
COLORS.background = '#0C243E'       // Bleu foncé
COLORS.success = '#4CAF50'          // Vert
COLORS.error = '#F44336'            // Rouge
COLORS.card = 'rgba(0, 0, 0, 0.3)'
COLORS.cardBorder = 'rgba(255, 255, 255, 0.1)'
COLORS.text = '#FFFFFF'
COLORS.textSecondary = 'rgba(255, 255, 255, 0.7)'
COLORS.textMuted = 'rgba(255, 255, 255, 0.5)'

// Fonts
FONTS.title = 'LuckiestGuy_400Regular'
FONTS.body = 'OpenSans_400Regular'
FONTS.bodySemiBold = 'OpenSans_600SemiBold'
FONTS.bodyBold = 'OpenSans_700Bold'

// Spacing
SPACING = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 }
BORDER_RADIUS = { sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999 }
```

### Patterns d'animation
```typescript
// Entrée d'écran
<Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>

// Transition entre étapes
<Animated.View entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(300)}>

// Pulsation badge
scale.value = withRepeat(withSequence(
  withTiming(1.1, { duration: 500 }),
  withTiming(1, { duration: 500 })
), -1, true);
```

---

## RÈGLES STRICTES

1. **Utiliser EXACTEMENT les couleurs/fonts/spacing du design system** (voir `src/styles/`)
2. **TypeScript strict** — pas de `any`, pas de `@ts-ignore`
3. **React.memo** sur tous les composants enfants
4. **Animations 60fps** — uniquement Reanimated (jamais `Animated` de RN)
5. **Pattern identique** aux fichiers existants (imports, structure, styles)
6. **Pas de nouvelles dépendances npm** — utiliser uniquement ce qui est installé
7. **Utiliser les actions du store existant** — ne pas modifier `useChallengeStore.ts` sauf si absolument nécessaire
8. **Chaque modal doit être un composant autonome** importable et testable indépendamment
9. **ScrollView** pour tout contenu susceptible de dépasser l'écran
10. **useSafeAreaInsets** pour tous les écrans

---

## ORDRE D'IMPLÉMENTATION

1. **Étape 1** : Chargement initial des challenges (`_layout.tsx` + `home.tsx`)
2. **Étape 2** : Écran détail challenge (`[challengeId].tsx`)
3. **Étape 3** : Modal Pitch Builder (`PitchBuilderModal.tsx`)
4. **Étape 4** : Modal Business Plan (`BusinessPlanModal.tsx`)
5. **Étape 5** : Modal Quiz Final + Certificat (`FinalQuizModal.tsx`)
6. **Étape 6** : Intégration des modals dans le Hub (`challenge-hub.tsx` modifié)
7. **Étape 7** : Sync XP retour de partie (`results/[gameId].tsx`)
8. **Étape 8** : Export des nouveaux composants dans `src/components/challenges/index.ts`

---

## RÉSUMÉ DES FICHIERS À CRÉER/MODIFIER

### À CRÉER :
- `src/app/(challenges)/[challengeId].tsx` — Écran détail Challenge
- `src/components/challenges/PitchBuilderModal.tsx` — Formulaire pitch 5 étapes
- `src/components/challenges/BusinessPlanModal.tsx` — Formulaire BP simplifié/complet
- `src/components/challenges/FinalQuizModal.tsx` — Quiz global + certificat
- `src/data/challenges/quizQuestions.ts` — Questions du quiz final YEAH

### À MODIFIER :
- `src/app/(challenges)/_layout.tsx` — Ajouter chargement auto des challenges
- `src/app/(challenges)/challenge-hub.tsx` — Intégrer les modals de livrables + rendre items cliquables
- `src/app/(tabs)/home.tsx` — Charger les challenges au démarrage
- `src/app/(game)/results/[gameId].tsx` — Sync XP vers enrollment
- `src/components/challenges/index.ts` — Ajouter les exports des nouveaux composants

### NE PAS MODIFIER :
- `src/types/challenge.ts`
- `src/stores/useChallengeStore.ts`
- `src/data/challenges/yeah.ts`
- `src/components/challenges/ChallengeHomeCard.tsx`
- `src/components/challenges/SectorChoiceModal.tsx`
- `src/app/(challenges)/my-programs.tsx`
- `src/app/(game)/challenge-game.tsx`
