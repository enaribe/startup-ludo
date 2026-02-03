# 🎯 Prompt pour Cursor - Implémentation Complète du Système de Challenges

## Contexte

Tu es un développeur expert en React Native/Expo et TypeScript. Tu dois implémenter un système complet de **challenges d'entrepreneuriat** pour une application de jeu de plateau éducatif.

Une sauvegarde complète de l'implémentation originale se trouve dans le dossier **`challenge-backup-original/`**. Ce dossier contient 131 fichiers organisés incluant tous les écrans, composants, logique métier, types, données, et documentation.

## 📋 Ta Mission

Implémente le système de challenges complet en te basant sur le code dans `challenge-backup-original/`. Tu dois :

1. **Recréer TOUS les fichiers** du système de challenges dans leurs emplacements appropriés dans `src/`
2. **Maintenir la même architecture** et structure que l'original
3. **Préserver toutes les fonctionnalités** (design, animations, logique métier)
4. **Assurer la compatibilité** avec le reste de l'application existante
5. **Optimiser et améliorer** le code si tu identifies des opportunités (sans changer les fonctionnalités)

## 🗂️ Structure à Implémenter

### 1. Types et Interfaces (`src/types/`)
**Priorité : CRITIQUE - À faire en PREMIER**

Commence par copier et implémenter :
- `src/types/challenge.ts` - Tous les types du système de challenges
  - `Challenge`, `ChallengeLevel`, `ChallengeSubLevel`
  - `ChallengeSector`, `ChallengeEnrollment`
  - `ChallengeDeliverables`, `ChallengeCard`, `ChallengeEvent`
- Met à jour `src/types/index.ts` avec les exports nécessaires et `RootStackParamList`

### 2. Données (`src/data/`)
**Priorité : CRITIQUE - À faire en SECOND**

Implémente toutes les données :
- `src/data/challenges/yeah.ts` - Challenge YEAH complet avec tous ses secteurs et niveaux
- `src/data/challenges/quizQuestions.ts` - Questions de quiz
- `src/data/challenges/index.ts` - Fonctions d'export (getChallengeById, etc.)
- `src/data/duelQuestions.ts` - Questions pour les duels
- Met à jour `src/data/index.ts` avec getRandomEvent, getRandomChallenge

### 3. State Management (`src/stores/`)
**Priorité : CRITIQUE - À faire en TROISIÈME**

Implémente les stores Zustand :
- **`src/stores/useChallengeStore.ts`** - Store principal avec :
  - État : challenges, enrollments, selectedChallenge
  - Actions : enrollInChallenge, updateProgress, submitDeliverable, etc.
  - Intégration Firebase (Firestore)
- Met à jour `src/stores/useGameStore.ts` pour inclure le `ChallengeContext`
- Met à jour `src/stores/index.ts` avec les exports

### 4. Services (`src/services/`)
**Priorité : HAUTE**

Implémente les services métier :
- `src/services/game/EventManager.ts` - Gestion des événements challenges
- `src/services/game/GameEngine.ts` - Intégration des challenges dans le moteur
- `src/services/firebase/firestore.ts` - Fonctions Firestore pour challenges
- `src/services/multiplayer/MultiplayerSync.ts` - Synchronisation duels en ligne

### 5. Composants UI (`src/components/`)
**Priorité : HAUTE**

Implémente tous les composants :

#### Composants de Challenges (`src/components/challenges/`)
- `ChallengeHomeCard.tsx` - Carte d'affichage à l'accueil
- `SectorChoiceModal.tsx` - Modal choix de secteur (Niveau 1)
- `PitchBuilderModal.tsx` - Modal construction pitch (Niveau 2)
- `BusinessPlanModal.tsx` - Modal business plan (Niveau 3)
- `FinalQuizModal.tsx` - Modal quiz final (Niveau 4)
- `index.ts` - Exports

#### Popups de Jeu (`src/components/game/popups/`)
- `DuelPreparePopup.tsx` - Préparation du duel
- `DuelSelectOpponentPopup.tsx` - Sélection d'adversaire
- `DuelQuestionPopup.tsx` - Questions de duel
- `DuelResultPopup.tsx` - Résultats du duel
- `DuelSpectatorPopup.tsx` - Mode spectateur
- `QuizPopup.tsx` - Quiz général
- `EventPopup.tsx` - Événements challenges/opportunités
- `FundingPopup.tsx` - Financement
- `VictoryPopup.tsx` - Victoire
- `QuitConfirmPopup.tsx` - Confirmation abandon
- `PopupIcons.tsx` - Icônes des popups

### 6. Écrans (`src/app/`)
**Priorité : HAUTE**

Implémente tous les écrans :

#### Navigation Challenges (`src/app/(challenges)/`)
- `_layout.tsx` - Layout de navigation
- `challenge-hub.tsx` - Hub principal (liste des challenges)
- `[challengeId].tsx` - Détail d'un challenge
- `my-programs.tsx` - Programmes de l'utilisateur

#### Écran de Jeu
- `src/app/(game)/challenge-game.tsx` - Jeu lancé depuis un challenge

#### Intégration à l'accueil
- Met à jour `src/app/(tabs)/home.tsx` pour afficher les challenges

### 7. Hooks Personnalisés (`src/hooks/`)
**Priorité : MOYENNE**

Implémente les hooks :
- `useDuel.ts` - Gestion des duels
- `useOnlineGame.ts` - Jeux en ligne (duels)
- Met à jour `index.ts`

### 8. Configuration (`src/config/`)
**Priorité : MOYENNE**

Implémente la configuration :
- `progression.ts` - Ajout de la progression challenges
- `achievements.ts` - Achievements liés aux challenges
- `boardConfig.ts` - Si besoin de modifications

### 9. Styles (`src/styles/`)
**Priorité : MOYENNE**

Vérifie et complète les styles :
- `colors.ts` - Ajoute les couleurs spécifiques aux challenges
- `typography.ts`, `spacing.ts` - Vérifie la cohérence

### 10. Utilitaires et Constants (`src/utils/`, `src/constants/`)
**Priorité : BASSE**

Complète si nécessaire :
- `src/utils/boardUtils.ts` - Utilitaires plateau
- `src/constants/images.ts` - Références aux logos challenges
- `src/constants/animations.ts` - Animations Lottie

## 🎨 Fonctionnalités à Implémenter

### Flux Utilisateur Principal

1. **Découverte des Challenges**
   - Écran d'accueil affiche une carte `ChallengeHomeCard`
   - Navigation vers `challenge-hub` pour voir tous les challenges
   - Détail d'un challenge sur `[challengeId]`

2. **Inscription à un Challenge**
   - Bouton "S'inscrire" crée un `ChallengeEnrollment`
   - Sauvegarde dans Firestore via `useChallengeStore`
   - Redirection vers le premier niveau

3. **Progression dans les Niveaux**
   - **Niveau 0 (Secteur)** : `SectorChoiceModal` pour choisir un secteur
   - **Niveau 1 (Pitch)** : `PitchBuilderModal` pour construire le pitch
   - **Niveau 2 (Business Plan)** : `BusinessPlanModal` pour le business plan
   - **Niveau 3 (Quiz Final)** : `FinalQuizModal` pour valider les connaissances

4. **Soumission de Livrables**
   - Chaque modal permet de soumettre un livrable
   - Validation et sauvegarde dans `ChallengeEnrollment.deliverables`
   - Passage au niveau suivant si validé

5. **Intégration dans le Jeu**
   - Lors d'un lancer de dé, événements "challenge" peuvent apparaître
   - `EventPopup` affiche l'événement challenge
   - Impact sur la progression du joueur

6. **Système de Duels**
   - Duels locaux (contre IA)
   - Duels en ligne (multiplayer)
   - Questions de duel avec timer
   - Mode spectateur pour observer les duels
   - Résultats et récompenses

### Firebase Integration

Assure-toi que :
- Firestore stocke les `challenges` et `enrollments`
- Realtime Database gère les duels en ligne
- Les règles de sécurité sont respectées
- La synchronisation est temps réel

### Animations et UX

Préserve :
- Toutes les animations Lottie
- Les transitions fluides entre les écrans
- Les retours haptiques et sonores
- Le design system cohérent

## ⚙️ Technologies à Utiliser

- **React Native** avec Expo
- **TypeScript** (strict mode)
- **Zustand** pour le state management
- **Firebase** (Firestore + Realtime Database + Auth)
- **Expo Router** pour la navigation
- **NativeWind** pour le styling (Tailwind CSS)
- **Lottie** pour les animations
- **Expo Audio** et **Expo Haptics**

## 📝 Instructions Spécifiques

### 1. Ordre d'Implémentation STRICT

```
1. Types (challenge.ts, index.ts)
2. Données (challenges/yeah.ts, challenges/index.ts, duelQuestions.ts)
3. Store (useChallengeStore.ts)
4. Services (EventManager.ts, firestore.ts)
5. Composants (modales de challenges, puis popups de jeu)
6. Écrans (navigation challenges, puis intégration)
7. Hooks (useDuel.ts, useOnlineGame.ts)
8. Configuration et styles
```

### 2. Référence au Code Original

Pour CHAQUE fichier que tu crées :
- Ouvre le fichier correspondant dans `challenge-backup-original/`
- Copie l'intégralité du code
- Place-le dans le bon emplacement dans `src/`
- Vérifie les imports et adapte si nécessaire
- Teste que le fichier compile sans erreur

### 3. Gestion des Imports

Assure-toi que tous les imports sont corrects :
```typescript
// Exemples d'imports typiques
import { useChallengeStore } from '@/stores/useChallengeStore'
import { Challenge, ChallengeEnrollment } from '@/types/challenge'
import { getChallengeById } from '@/data/challenges'
```

### 4. Intégration Firebase

Configure correctement Firebase :
```typescript
// Dans useChallengeStore.ts
import { db } from '@/services/firebase/config'
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'

// Exemple de fonction
async enrollInChallenge(challengeId: string, userId: string) {
  const enrollment: ChallengeEnrollment = {
    id: `${userId}_${challengeId}`,
    userId,
    challengeId,
    currentLevel: 0,
    currentSubLevel: 0,
    startedAt: new Date(),
    deliverables: {},
    status: 'active'
  }

  await setDoc(doc(db, 'challengeEnrollments', enrollment.id), enrollment)
}
```

### 5. Navigation Expo Router

Assure-toi que la navigation fonctionne :
```typescript
// Dans _layout.tsx des challenges
import { Stack } from 'expo-router'

export default function ChallengesLayout() {
  return (
    <Stack>
      <Stack.Screen name="challenge-hub" options={{ title: 'Challenges' }} />
      <Stack.Screen name="[challengeId]" options={{ title: 'Détail' }} />
      <Stack.Screen name="my-programs" options={{ title: 'Mes Programmes' }} />
    </Stack>
  )
}
```

### 6. Styling avec NativeWind

Utilise NativeWind (Tailwind) pour le styling :
```typescript
<View className="flex-1 bg-gray-900 p-4">
  <Text className="text-2xl font-bold text-white mb-4">
    {challenge.name}
  </Text>
</View>
```

### 7. Animations Lottie

Intègre les animations :
```typescript
import LottieView from 'lottie-react-native'
import { ANIMATIONS } from '@/constants/animations'

<LottieView
  source={ANIMATIONS.celebration}
  autoPlay
  loop={false}
  style={{ width: 200, height: 200 }}
/>
```

## ✅ Checklist de Validation

Après l'implémentation, vérifie que :

### Fonctionnalités de Base
- [ ] Le hub des challenges s'affiche avec la liste des challenges
- [ ] On peut voir le détail d'un challenge
- [ ] On peut s'inscrire à un challenge
- [ ] L'inscription crée un enrollment dans Firestore
- [ ] La progression est sauvegardée en temps réel

### Niveaux et Livrables
- [ ] Le modal de choix de secteur (Niveau 0) fonctionne
- [ ] Le modal de pitch builder (Niveau 1) fonctionne
- [ ] Le modal de business plan (Niveau 2) fonctionne
- [ ] Le modal de quiz final (Niveau 3) fonctionne
- [ ] Les livrables sont sauvegardés correctement
- [ ] La progression passe au niveau suivant après validation

### Système de Duels
- [ ] On peut lancer un duel local
- [ ] On peut sélectionner un adversaire
- [ ] Les questions de duel s'affichent avec timer
- [ ] Les résultats s'affichent correctement
- [ ] Les duels en ligne fonctionnent (multiplayer)
- [ ] Le mode spectateur fonctionne

### Intégration dans le Jeu
- [ ] Les événements challenges apparaissent pendant le jeu
- [ ] EventPopup affiche correctement les événements
- [ ] Les opportunités et challenges sont bien différenciés
- [ ] La logique du GameEngine intègre les challenges

### Firebase
- [ ] Les challenges sont dans Firestore
- [ ] Les enrollments sont créés et mis à jour
- [ ] La Realtime Database gère les duels en ligne
- [ ] L'authentification est requise pour les challenges

### UI/UX
- [ ] Toutes les animations Lottie fonctionnent
- [ ] Les transitions entre écrans sont fluides
- [ ] Les couleurs et le design sont cohérents
- [ ] Les sons et haptiques fonctionnent
- [ ] L'interface est responsive

### Navigation
- [ ] La navigation entre les écrans de challenges fonctionne
- [ ] Le retour arrière fonctionne correctement
- [ ] Les paramètres de navigation sont passés correctement
- [ ] Deep linking fonctionne si implémenté

### Performance
- [ ] Pas de warning TypeScript
- [ ] Pas de warning React
- [ ] L'application ne crash pas
- [ ] Les données se chargent rapidement
- [ ] Pas de memory leaks

## 🚨 Points d'Attention

### 1. Types TypeScript
Assure-toi que tous les types sont corrects et cohérents. Si TypeScript se plaint, c'est qu'il y a un problème réel à corriger.

### 2. État Global
`useChallengeStore` est le SEUL point de vérité pour l'état des challenges. Tous les composants doivent l'utiliser.

### 3. Firebase Security
Ne modifie JAMAIS les règles de sécurité Firebase sans comprendre les implications.

### 4. Async/Await
Toutes les opérations Firebase sont asynchrones. Gère correctement les erreurs :
```typescript
try {
  await enrollInChallenge(challengeId, userId)
} catch (error) {
  console.error('Error enrolling:', error)
  // Afficher un message d'erreur à l'utilisateur
}
```

### 5. Memory Leaks
Nettoie les listeners Firebase :
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(doc(db, 'challenges', id), (doc) => {
    // ...
  })

  return () => unsubscribe()
}, [id])
```

### 6. Navigation Types
Assure-toi que `RootStackParamList` dans `types/index.ts` inclut tous les écrans :
```typescript
export type RootStackParamList = {
  'challenge-hub': undefined
  '[challengeId]': { challengeId: string }
  'my-programs': undefined
  'challenge-game': { challengeId: string, enrollmentId: string }
  // ... autres écrans
}
```

## 📚 Documentation à Consulter

Dans `challenge-backup-original/docs/` :
- `FICHE_TECHNIQUE_CHALLENGE.md` - Spécifications complètes
- `CHALLENGE_DESIGN_SYSTEM.md` - Design system
- `DUEL_IMPLEMENTATION_PLAN.md` - Plan d'implémentation des duels
- `README.md` - Vue d'ensemble du backup

## 🎯 Résultat Attendu

À la fin, l'application doit avoir :

1. **Un système de challenges complet et fonctionnel** identique à l'original
2. **Tous les écrans et composants** avec le même design et les mêmes animations
3. **Toute la logique métier** (inscription, progression, validation)
4. **L'intégration Firebase** complète et sécurisée
5. **Le système de duels** local et en ligne
6. **Une navigation fluide** entre tous les écrans
7. **Un code propre** sans warnings ni erreurs TypeScript

## 🚀 Commande de Démarrage

Une fois l'implémentation terminée, teste avec :
```bash
npx expo start
```

Puis teste toutes les fonctionnalités dans l'ordre de la checklist.

---

## 💡 Conseils Cursor

- Utilise **Cmd+K** pour demander à Cursor d'implémenter un fichier spécifique
- Référence toujours le fichier original : "Implémente `src/stores/useChallengeStore.ts` basé sur `challenge-backup-original/stores/useChallengeStore.ts`"
- Demande à Cursor de vérifier les imports après chaque fichier créé
- Teste au fur et à mesure, ne crée pas tous les fichiers d'un coup
- Si un fichier a des erreurs, montre l'erreur à Cursor et demande de corriger

## ✨ Améliorations Optionnelles

Si tu veux améliorer le code original :
- Ajoute des tests unitaires pour les stores
- Améliore la gestion des erreurs
- Ajoute des loading states
- Optimise les requêtes Firebase
- Ajoute du caching pour les données
- Améliore l'accessibilité

Mais fais cela SEULEMENT après avoir recréé l'implémentation complète et fonctionnelle.

---

**Bon courage ! Tu as tout ce qu'il faut dans `challenge-backup-original/` pour réussir.**
