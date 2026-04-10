# StartUp Ludo — Mode Forum : Document Technique d'Implémentation

## Contexte

Ce document décrit l'implémentation d'une **version "Forum"** de l'application StartUp Ludo, conçue pour être utilisée sur un appareil partagé lors d'expositions ou forums entrepreneuriaux. Le parcours est direct et rapide, sans compte utilisateur requis.

**Parcours utilisateur :**
`Welcome` → `Sélection nb joueurs` → `Saisie noms/startups (séquentiel)` → `Jeu` → `Résultats` → `Nouvelle partie`

---

## Architecture du projet

```
startup-ludo/
├── src/
│   ├── app/
│   │   ├── (forum)/           ← NOUVEAU groupe de routes forum
│   │   │   ├── _layout.tsx
│   │   │   ├── welcome.tsx
│   │   │   ├── setup.tsx
│   │   │   ├── play.tsx
│   │   │   └── results.tsx
│   │   ├── (auth)/            ← inchangé
│   │   ├── (tabs)/            ← inchangé
│   │   ├── (game)/            ← inchangé
│   │   ├── (challenges)/      ← inchangé
│   │   └── index.tsx          ← modifié (4 lignes ajoutées)
│   ├── services/
│   │   └── firebase/
│   │       ├── forumService.ts  ← ✅ Phase 3
│   │       └── config.ts        ← ✅ Phase 3 (collections forum)
│   └── stores/
│       └── useGameStore.ts    ← inchangé
├── app.config.js              ← NOUVEAU (remplace app.json)
├── eas.json                   ← modifié (profil forum ajouté)
└── FORUM_MODE_IMPLEMENTATION.md
```

---

## Stack technique

- **Framework** : React Native + Expo SDK (expo-router v5, file-based routing)
- **Navigation** : Expo Router — groupe `(forum)` avec Stack
- **État du jeu** : Zustand — `useGameStore` (réutilisé tel quel)
- **Base de données** : Firebase via `@react-native-firebase/firestore`
- **Build** : EAS Build (profil `forum`)
- **Env vars** : `EXPO_PUBLIC_APP_MODE`, `EXPO_PUBLIC_EVENT_NAME`, `EXPO_PUBLIC_STORE_URL`

---

## Principe de séparation (ne rien casser)

Le mode forum est activé **uniquement** via une variable d'environnement :

```js
// app.config.js
const IS_FORUM = process.env.EXPO_PUBLIC_APP_MODE === 'forum';
```

Dans `src/app/index.tsx`, les 4 lignes ajoutées :
```tsx
const IS_FORUM_MODE = Constants.expoConfig?.extra?.appMode === 'forum';

// ...après tous les hooks...
if (IS_FORUM_MODE) {
  return <Redirect href="/(forum)/welcome" />;
}
```

Sans la variable, l'app est strictement identique à l'original.

---

## État d'avancement

**Résumé** : phases **1 à 5** terminées. Build forum : `eas build --profile forum --platform ios|android`.

### ✅ Phase 1 — Flag & point d'entrée (TERMINÉE)

| Fichier | Statut | Description |
|---------|--------|-------------|
| `app.json` | Supprimé | Remplacé par app.config.js |
| `app.config.js` | ✅ Créé | Lit EXPO_PUBLIC_APP_MODE, expose extra.appMode/eventName/storeUrl |
| `eas.json` | ✅ Modifié | Profil `forum` ajouté |
| `src/app/index.tsx` | ✅ Modifié | IS_FORUM_MODE + Redirect vers /(forum)/welcome |
| `src/app/(forum)/_layout.tsx` | ✅ Créé | Stack forum, animation fade, gestureEnabled: false |

**Pour tester en dev :**
```bash
EXPO_PUBLIC_APP_MODE=forum npx expo start
```

---

### ✅ Phase 2 — Screens du groupe (forum) (TERMINÉE)

| Fichier | Statut | Description |
|---------|--------|-------------|
| `src/app/(forum)/welcome.tsx` | ✅ Créé | Logo + badge CLASSIQUE + rayons + bouton jouer |
| `src/app/(forum)/setup.tsx` | ✅ Créé | Sélection joueurs + saisie nom/startup, appelle initGame() |
| `src/app/(forum)/play.tsx` | ✅ Créé | Jeu local complet, tous les popups, redirect vers /results |
| `src/app/(forum)/results.tsx` | ✅ Créé | Classement jetons, carte gagnant, boutons relancer/accueil |

**Détails techniques importants :**

`setup.tsx` — logique de création des joueurs :
```ts
const players = drafts.map((d, i) => ({
  id: `forum-player-${i}`,
  name: d.name.trim() || `Joueur ${i + 1}`,
  color: colors[i],          // COLORS_BY_COUNT[playerCount]
  isAI: false,
  startupName: d.startupName.trim() || `Startup ${i + 1}`,
  startupId: `forum-startup-${i}`,
  isDefaultProject: true,
}));
initGame('local', 'classic', players);
router.replace('/(forum)/play');
```

`play.tsx` — redirection vers résultats forum :
```ts
useEffect(() => {
  if (!game || game.status !== 'finished' || !game.winner) return;
  const timer = setTimeout(() => {
    router.replace('/(forum)/results');  // ← différence clé vs (game)/play
  }, 1500);
  return () => clearTimeout(timer);
}, [game?.status, game?.winner, router]);
```

`useTurnMachine` — signature complète requise :
```ts
useTurnMachine({
  game,
  currentPlayer,
  actions,
  isOnline: false,
  userId: null,
  hapticsEnabled,      // depuis useSettingsStore
  setAnimating,        // depuis useGameStore
  clearSelection,      // depuis useGameStore
  onEvent: (eventType) => { /* dispatcher les popups selon game.pendingEvent.type */ },
  onWin: (playerId) => { /* géré par l'effet game.status */ },
})
// Retourne : { turnState, diceProps, handleEventResolve, chosenDiceValue, hasUsedDiceChoice, setChosenDiceValue }
```

---

### ✅ Phase 3 — Firebase séparé (TERMINÉE)

**Objectif** : Sauvegarder les sessions forum dans des collections Firestore dédiées, **sans toucher** aux collections existantes (`users`, `userStats`, `gameSessions`, etc.).

| Fichier | Statut | Description |
|---------|--------|-------------|
| `src/services/firebase/forumService.ts` | ✅ Créé | `saveForumSession`, `updateForumLeaderboard`, `getForumLeaderboard`, `forumPlayerNameToDocId` |
| `src/services/firebase/config.ts` | ✅ Modifié | `forumSessions`, `forumLeaderboard` dans `FIRESTORE_COLLECTIONS` |
| `src/services/firebase/index.ts` | ✅ Modifié | Réexport des API forum |
| `src/app/(forum)/results.tsx` | ✅ Modifié | `useEffect` + `Constants.expoConfig?.extra?.eventName`, synchro fire-and-forget (`.catch`) |

**À configurer côté Firebase (hors repo)** : règles de sécurité Firestore pour `forumSessions` / `forumLeaderboard` ; index si demandé pour `orderBy('bestScore')`.

#### Collections Firestore (référence)

**Collection `forumSessions`**
```ts
interface ForumSession {
  id: string;
  eventName: string;        // ex: "Forum Dakar 2026" (depuis EXPO_PUBLIC_EVENT_NAME)
  players: {
    name: string;
    startupName: string;
    tokens: number;
    rank: number;            // 1 = gagnant
  }[];
  winnerName: string;
  totalPlayers: number;
  createdAt: Timestamp;
}
```

**Collection `forumLeaderboard`**
```ts
// Document ID = slug du nom (ex: "babacar-birane")
interface ForumLeaderboardEntry {
  name: string;
  startupName: string;
  bestScore: number;         // meilleur nb de jetons en une partie
  totalWins: number;
  gamesPlayed: number;
  updatedAt: Timestamp;
}
```

#### Implémentation réelle (`forumService.ts`)

- `saveForumSession` : id `Date.now().toString()`, `createdAt: serverTimestamp()`.
- `updateForumLeaderboard` : document id = slug du nom (`forumPlayerNameToDocId`), `getDoc` + `setDoc(..., { merge: true })` pour agréger `gamesPlayed`, `totalWins`, `bestScore`.
- Imports : `@react-native-firebase/firestore` (modulaire, comme le reste du projet).

---

### ✅ Phase 4 — QR Code sur le welcome screen (TERMINÉE)

**Objectif** : Afficher un QR code sur le welcome screen pointant vers l'URL du store, pour que les spectateurs puissent télécharger l'app.

| Élément | Statut | Description |
|---------|--------|-------------|
| Dépendance | ✅ | `react-native-qrcode-svg` (peer : `react-native-svg` déjà présent) |
| `src/app/(forum)/welcome.tsx` | ✅ | Section « POURSUIVRE ICI » + QR 90×90, fond blanc `#FFFFFF`, padding 8, `borderRadius` 12, sous le bouton jaune |
| `app.config.js` | ✅ | `extra.storeUrl` ← `EXPO_PUBLIC_STORE_URL` (déjà exposé) |

**Comportement** : le QR s’affiche uniquement si `EXPO_PUBLIC_STORE_URL` est une chaîne non vide (trim). Sinon, rien n’est affiché (dev sans URL).

**Build forum** : renseigner dans `eas.json` (profil `forum`) :
```json
"EXPO_PUBLIC_STORE_URL": "https://apps.apple.com/app/startup-ludo/idXXXXXXXXX"
```

---

### ✅ Phase 5 — Build EAS forum (TERMINÉE)

| Élément | Statut | Description |
|---------|--------|-------------|
| `eas.json` profil `forum` | ✅ | `EXPO_PUBLIC_STORE_URL` → fiche **Play Store** (`id=com.startupludo.app`). Remplacer par une URL **App Store** si besoin (QR / store iOS). |
| `app.config.js` | ✅ | `name` forum déjà défini ; **icône** : si le fichier `assets/images/iconludo-forum.png` existe, il est utilisé en build forum (iOS + adaptive Android), sinon icône standard. |
| `bundleIdentifier` / `package` | ✅ | Inchangés (`com.startupludo.app`) — même binaire « forum » via variables d’env (pas d’identifiant séparé obligatoire). |

**Commandes :**
```bash
eas build --profile forum --platform ios
eas build --profile forum --platform android
```

**Notes :**
- Pour un lien **App Store** dans le QR : mettre à jour `EXPO_PUBLIC_STORE_URL` dans `eas.json` (profil `forum`).
- Icône forum optionnelle : ajouter le PNG `assets/images/iconludo-forum.png` (même taille/format que `iconludo.png` recommandé).

---

## Fichiers clés à connaître pour continuer

| Fichier | Rôle |
|---------|------|
| `src/hooks/useTurnMachine.ts` | Machine à états des tours — signature précise requise |
| `src/hooks/useDuel.ts` | Gestion des duels locaux — interface `UseDuelReturn` |
| `src/services/game/GameEngine.ts` | Moteur du jeu — ne pas modifier |
| `src/stores/useGameStore.ts` | Store Zustand du jeu — `initGame(mode, edition, players)` |
| `src/services/firebase/config.ts` | Collections Firestore + types Firebase |
| `src/services/firebase/firestore.ts` | Services Firestore existants — ne pas modifier |
| `src/components/ui/GameButton.tsx` | Props : `title, variant, fullWidth, disabled, onPress, style, loading` |
| `src/components/game/popups/DuelPreparePopup.tsx` | Props : `visible, phase, challenger, opponent, currentPlayerId, onStart` |
| `src/components/game/popups/DuelQuestionPopup.tsx` | Props : `visible, questions, onComplete, onClose` |
| `src/components/game/popups/DuelResultPopup.tsx` | Props : `visible, result, challenger, opponent, currentPlayerId, onClose` |

---

## Points d'attention pour Cursor

1. **Ne jamais modifier** `src/app/(game)/`, `src/app/(auth)/`, `src/app/(tabs)/`, `src/stores/useGameStore.ts`, `src/services/firebase/firestore.ts`

2. **Imports Firebase** : utiliser `@react-native-firebase/firestore` (pas `firebase/firestore`)
   ```ts
   import { getFirestore, collection, doc, setDoc, ... } from '@react-native-firebase/firestore';
   ```

3. **Styles** : toujours utiliser `FONTS`, `FONT_SIZES`, `SPACING`, `COLORS` depuis les fichiers de styles existants :
   - `src/styles/typography.ts` — `FONTS.title`, `FONTS.body`, `FONTS.bodySemiBold`, `FONT_SIZES.xs/sm/base/lg/xl/2xl`
   - `src/styles/spacing.ts` — `SPACING[1..8]`, `BORDER_RADIUS`
   - `src/styles/colors.ts` — `COLORS`

4. **RadialBackground** s'utilise ainsi :
   ```tsx
   <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />
   ```

5. **GameButton** ne supporte PAS de prop `icon`. Variants disponibles : `'green' | 'yellow' | 'blue' | 'red'`

6. **useTurnMachine** requiert ces props obligatoires : `game, currentPlayer, isOnline, userId, actions, onEvent, onWin, hapticsEnabled, setAnimating, clearSelection`

7. **Le logo** est à : `require('@/../assets/images/logostartupludo.png')`

---

## Prompts (référence Cursor)

### PROMPT — Phase 3 : Firebase séparé *(terminée — archive)*

```
Je travaille sur l'application React Native "StartUp Ludo" (Expo Router, @react-native-firebase).

Je dois créer un service Firebase dédié au mode "Forum" qui sauvegarde les parties sans toucher 
aux collections existantes (users, userStats, gameSessions).

Fichier à créer : src/services/firebase/forumService.ts

Ce fichier doit exporter :

1. Interface ForumSession :
{
  id: string,
  eventName: string,
  players: { name: string, startupName: string, tokens: number, rank: number }[],
  winnerName: string,
  totalPlayers: number,
  createdAt: Timestamp
}

2. Interface ForumLeaderboardEntry :
{
  name: string,
  startupName: string,
  bestScore: number,
  totalWins: number,
  gamesPlayed: number,
  updatedAt: Timestamp
}

3. Fonctions :
- saveForumSession(session: Omit<ForumSession, 'id' | 'createdAt'>): Promise<void>
  → utilise setDoc avec un ID généré (Date.now().toString())
  → ajoute createdAt: serverTimestamp()

- updateForumLeaderboard(players: { name: string, startupName: string, tokens: number, isWinner: boolean }[]): Promise<void>
  → pour chaque joueur, upsert dans la collection forumLeaderboard
  → l'ID du document = nom du joueur en lowercase, espaces remplacés par "-"
  → si le doc existe déjà : incrémenter gamesPlayed, totalWins si isWinner, mettre à jour bestScore si tokens > bestScore
  → utiliser setDoc avec { merge: true }

- getForumLeaderboard(limitCount?: number): Promise<ForumLeaderboardEntry[]>
  → query sur forumLeaderboard, orderBy('bestScore', 'desc'), limit(limitCount ?? 10)

Imports Firebase à utiliser (obligatoire — NE PAS utiliser firebase/firestore) :
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from '@react-native-firebase/firestore';

Ajouter aussi dans src/services/firebase/config.ts dans FIRESTORE_COLLECTIONS :
  forumSessions: 'forumSessions',
  forumLeaderboard: 'forumLeaderboard',

Enfin, dans src/app/(forum)/results.tsx, appeler ces fonctions dans un useEffect déclenché 
quand game.status === 'finished', avec try/catch et sans bloquer l'UI (fire-and-forget).
Importer Constants depuis 'expo-constants' pour récupérer le nom de l'événement :
Constants.expoConfig?.extra?.eventName ?? ''
```

---

### PROMPT — Phase 4 : QR Code *(terminée — archive)*

```
Je travaille sur l'application React Native "StartUp Ludo" (Expo Router).

Je dois ajouter un QR code sur le welcome screen du mode forum.

Fichier à modifier : src/app/(forum)/welcome.tsx

1. Installer la dépendance (déjà fait si react-native-svg est présent) :
   npm install react-native-qrcode-svg
   L'import est : import QRCode from 'react-native-qrcode-svg';

2. Récupérer l'URL depuis les constantes :
   const storeUrl = Constants.expoConfig?.extra?.storeUrl as string | undefined;
   (Constants est déjà importé dans ce fichier)

3. Ajouter dans la section buttonsSection, SOUS le bouton "TOUCHEZ POUR JOUER" :
   - Un texte "POURSUIVRE ICI" en blanc semi-transparent, police FONTS.title, taille FONT_SIZES.sm
   - Un composant QRCode avec value={storeUrl}, size={90}, backgroundColor="white", color="#0C243E"
   - Encapsulé dans une View avec fond blanc, borderRadius 12, padding 8
   - N'afficher cette section QUE si storeUrl est non-vide

4. Style à ajouter :
   qrSection: { alignItems: 'center', marginTop: SPACING[3] }
   qrLabel: { fontFamily: FONTS.title, fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.6)', marginBottom: SPACING[2], letterSpacing: 1 }
   qrWrapper: { backgroundColor: 'white', borderRadius: 12, padding: 8 }

Ne pas modifier les autres éléments du fichier.
```

---

### PROMPT — Phase 5 : Build EAS forum *(terminée — archive)*

```
(Voir section Phase 5 ci-dessus — eas.json, app.config.js, commandes eas build.)
```

---

## Commandes utiles

```bash
# Lancer en mode forum (dev)
EXPO_PUBLIC_APP_MODE=forum npx expo start

# Lancer en mode normal (dev)
npx expo start

# Builder en mode forum (iOS)
eas build --profile forum --platform ios

# Builder en mode forum (Android)
eas build --profile forum --platform android

# Vérifier TypeScript
npx tsc --noEmit --skipLibCheck
```
