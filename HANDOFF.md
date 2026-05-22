# HANDOFF — Startup Ludo

> Document de passation pour reprendre le travail (Codex, nouvelle session, autre dev).
> Dernière mise à jour : 2026-05-20 · Branche : `dev`

---

## 1. Le projet

**Startup Ludo** — Jeu de société mobile éducatif sur l'entrepreneuriat (React Native + Expo SDK 54, TypeScript).

- State : Zustand + Immer
- Backend : Firebase (Auth, Firestore, Realtime Database pour le multijoueur)
- Navigation : Expo Router (dossier `src/app/`)
- IA : OpenAI GPT-4o-mini (`src/services/ai/openai.ts`)
- Langue de travail : **français** (commentaires, UI, communication)

### Conventions importantes
- Cartes sélectionnables : fond `rgba(0,0,0,0.35)` + `DynamicGradientBorder`, gradient jaune doré à la sélection
- Ne JAMAIS wrapper un `TextInput` dans un Svg/gradient absolute (casse le clavier Android) — utiliser une bordure CSS native
- Éviter les `<Path d="...">` SVG complexes avec gradient dans les popups (crash Android FR) — préférer des icônes SVG minimales
- Popups : utiliser le composant **`GamePopup`** (`src/components/ui/GamePopup.tsx`) — animations + design standard
- Vérification systématique après changement : `npx tsc --noEmit --skipLibCheck`

---

## 2. ⚠️ ACTIONS OBLIGATOIRES avant test (déploiement Firebase)

Plusieurs fonctionnalités **ne marcheront pas** tant que la config Firebase n'est pas déployée :

```bash
firebase deploy --only firestore:rules     # règles : gameInvitations + usernames
firebase deploy --only firestore:indexes   # index : gameSessions (historique)
```

`firestore.rules` (non commité) contient les blocs `gameInvitations` (F01) et `usernames` (pseudo unique).
Symptôme si non déployé : `[firestore/permission-denied]` sur l'envoi d'invitation et la réservation de pseudo.

---

## 3. Travail réalisé

### Chantier A — Multijoueur (déconnexion + classement)
- **Déconnexion** : dans une partie 3-4 joueurs, un joueur déconnecté est éjecté (forfait) sans interrompre les autres. Popup "Réclamer la victoire" seulement quand il reste 2 joueurs.
  - `useGameStore.forfeitPlayer`, `Player.isForfeited` / `forfeitedAt`, `DISCONNECT_GRACE_PERIOD_MS = 20000`
- **Classement multi-joueurs** : en 3+ joueurs, la partie continue après le 1er arrivé pour classer 2e/3e/4e.
  - `useGameStore.finishPlayer(playerId): boolean`, `Player.rank` / `finishedAt`, `GameState.ranking`
  - `useTurnMachine.onWin` retourne un `boolean`, `nextTurn` saute forfaits + déjà classés

### Chantier B — Feedbacks Babacar BIRANE
Détail des 23 feedbacks dans **`PLAN_FEEDBACKS_BABACAR.md`**.

**✅ Corrigés (10/23)** :

| ID | Sujet | Solution |
|----|-------|----------|
| F01 | Invitation à une partie | Invitation in-app par contact suivi : `gameInvitationService.ts`, `useInvitationStore.ts`, `InviteContactModal.tsx` (basé GamePopup), `GameInvitationPopup.tsx`. Push natif reporté V1.5 |
| F02 | Code d'invitation = lien | Deep link `startupludo://join/CODE` — `inviteLink.ts`, route `src/app/join/[code].tsx` |
| F05 | Clic "Créer un compte" revient à l'accueil | Guards `isAuthenticated && !user?.isGuest` dans `login`, `register`, `index` |
| F06 | Pas d'endroit clair pour créer un compte | Bannière `GuestPromoBanner` en haut de l'accueil |
| F07 | Paramètres affichent "connecté" pour un invité | `settings.tsx` : section COMPTE + boutons adaptés, badge INVITÉ |
| F09 | Création manuelle d'entreprise | Déjà en place — option "CRÉER MANUELLEMENT" |
| F10 | Expliquer la valorisation initiale | IA génère valorisation + explication (`generateValuation`), modale dans `confirmation.tsx`, fallback algo |
| F11 | Messages d'erreur salon flous | `JoinRoomError` typée (6 codes), intégrée dans `MultiplayerSync`, `join-room`, `online-setup`, `quick-match` |
| F19 | Bouton "Se connecter" en mode invité | Couvert par F07 |

**⬜ Reste à faire** : F16/F18 (bugs jetons), F04/F08/F22 (décisions produit), F03/F12/F13/F14/F15/F17/F20/F21/F23 (roadmap).

### Autres demandes traitées (hors liste Babacar)

- **Timer anti-AFK** : en partie en ligne, si le joueur ne lance pas le dé en 15 s, le système le lance pour lui et joue le tour complet. Décompte affiché sur la **bordure de la PlayerCard** du joueur actif (`AfkCountdownBorder.tsx`, même couleur/épaisseur que la bordure de carte). Logique dans `useTurnMachine.ts` (effet symétrique à l'IA).
- **Salon — hôte qui quitte** : si l'hôte quitte la salle d'attente, le salon est dissous et tous les joueurs sont éjectés (Alert + retour online-hub). `MultiplayerSync.leaveRoom` supprime la room si hôte ; flag `roomClosed` dans `useMultiplayer`.
- **Duels en ligne — score spectateur temps réel** : nouvelle action remote `'dp'` (duel progress), broadcastée après chaque question. `DuelSpectatorPopup` affiche le score live des 2 duellistes (sans révéler les réponses). `DuelSelectOpponentPopup` redesigné au style duel (VsBadge).
- **Choix du projet auto dans le salon** : le `StartupSelectionModal` s'ouvre automatiquement et est non-fermable tant qu'aucun projet n'est choisi — dans `create-room`, `lobby/[roomId]`, `join-room`.
- **Pseudo unique obligatoire** : collection Firestore `usernames` (ID = pseudo en minuscules) garantit l'unicité. `usernameService.ts`. `complete-profile.tsx` devient le hub obligatoire (vérif dispo temps réel, plus de bouton "Passer"). Toutes les méthodes d'auth (email/Google/Apple/téléphone) y passent via `needsProfileCompletion`. Comptes existants : migration auto du `displayName` (`ensureUsernameForUser`) ou choix manuel si conflit. `searchUsers` migré sur la collection `usernames` (recherche insensible à la casse). Le pseudo est propagé dans `users` + `userStats` (classement, recherche).
- **EnrollmentFormModal** : gestion clavier corrigée (le champ téléphone reste visible au focus — `automaticallyAdjustKeyboardInsets` + scroll auto).
- **Écran Statistiques** (`history.tsx`) : la liste d'historique des parties a été **supprimée** (jamais alimentée de façon fiable). L'écran ne garde que les stats globales (Parties / Victoires % / XP) + un bloc Victoires/Défaites. Plus aucune requête réseau.

---

## 4. Architecture — système d'invitation (F01)

Hôte dans le salon → "Inviter un contact" → modale liste des contacts suivis (réutilise le système follow `socialService.ts`) → `sendGameInvitation` écrit dans `gameInvitations` → l'invité (app ouverte) reçoit via listener temps réel `subscribeToInvitations` → `GameInvitationPopup` → "Rejoindre" pousse vers `/(game)/join-room?code=XXX`.

- ID d'invitation **déterministe** : `inv_{roomId}_{toUserId}` (réinviter écrase)
- Invitations expirées après 10 min
- Invités : ni envoi ni réception (listener non démarré, bouton masqué)
- `InvitationListenerGate` dans `_layout.tsx` démarre/arrête le listener
- Logs debug `[INVITE]` présents (à retirer une fois validé)

### Convergence des écrans "rejoindre"
Les 3 voies convergent vers **`src/app/(game)/join-room.tsx`** (même design, même salle d'attente) :
- Invitation in-app acceptée → `join-room?code=XXX`
- Deep link externe → sas `join/[code].tsx` → `join-room?code=XXX`
- Saisie manuelle → `join-room` directement

---

## 5. Fichiers nouveaux (non commités)

```
HANDOFF.md / PLAN_FEEDBACKS_BABACAR.md             docs de suivi
src/app/join/[code].tsx                            sas deep link
src/components/game/GameInvitationPopup.tsx        popup réception invitation
src/components/game/InviteContactModal.tsx         modale liste contacts
src/components/game/AfkCountdownBorder.tsx         bordure-décompte anti-AFK
src/components/ui/GuestPromoBanner.tsx             bannière invité accueil
src/hooks/useGuestBannerDismiss.ts                 persistance dismiss bannière
src/stores/useInvitationStore.ts                   store invitations
src/services/firebase/gameInvitationService.ts     service Firestore invitations
src/services/firebase/usernameService.ts           service pseudos uniques
src/services/multiplayer/JoinRoomError.ts          erreurs typées de salon
src/services/multiplayer/inviteLink.ts             génération deep link
```

## 6. Fichiers modifiés clés (non commités)

`firestore.rules` (blocs gameInvitations + usernames), `_layout.tsx`, `index.tsx`,
`settings.tsx`, `home.tsx`, `history.tsx`, `(auth)/login.tsx`, `(auth)/register.tsx`,
`(auth)/complete-profile.tsx`, `(game)/create-room.tsx`, `(game)/join-room.tsx`,
`(game)/lobby/[roomId].tsx`, `(game)/online-setup.tsx`, `(game)/quick-match.tsx`,
`(game)/mode-selection.tsx`, `(game)/play/[gameId].tsx`, `(startup)/confirmation.tsx`,
`components/game/PlayerCard.tsx`, `components/game/popups/DuelQuestionPopup.tsx`,
`components/game/popups/DuelSpectatorPopup.tsx`, `components/game/popups/DuelSelectOpponentPopup.tsx`,
`components/challenges/EnrollmentFormModal.tsx`, `services/ai/openai.ts`,
`services/firebase/socialService.ts`, `services/firebase/usernameService.ts` (interne),
`services/multiplayer/MultiplayerSync.ts`, `hooks/useMultiplayer.ts`, `hooks/useTurnMachine.ts`,
`hooks/useOnlineGame.ts`, `hooks/useDuel.ts`, `types/index.ts`, `stores/index.ts`,
`components/ui/index.ts`, `services/firebase/index.ts`.

---

## 7. Bug ouvert en cours de diagnostic

**Duels en ligne — popup ne s'affiche pas chez l'adversaire.** Symptôme : quand un joueur lance un duel, le popup apparaît chez le lanceur mais pas chez l'adversaire. Des logs `[DUEL-DEBUG]` ont été posés dans `play/[gameId].tsx` (réception de l'événement duel + rendu du popup). Le diagnostic montre que le flux de code semble correct (broadcast `'ev'` → `joinDuel` → phase `intro` → `DuelPreparePopup`). **À reproduire avec 2 appareils et lire les logs `[DUEL-DEBUG]` côté adversaire** pour localiser où ça casse. Cause non encore trouvée.

---

## 8. Points ouverts / décisions en attente

1. **F04 vs blocage invité** : F04 demande d'autoriser les invités à jouer en ligne, mais le code bloque (popup "Compte requis"). Décision produit non tranchée.
2. **F10 — valorisation IA** : à calibrer pour que les valeurs IA (bornées 8 000–35 000 FCFA) ne cassent pas l'économie. Discuter avec game design.
3. **F12** : la question "quel profil vous ressemble" semble inexistante dans le code — à confirmer avec Babacar.
4. **F13** : gros chantier contenu (taxonomie PP/SP/PN/SN + ~80 descriptions de cartes).
5. **Logs `[INVITE]` et `[DUEL-DEBUG]`** : à retirer une fois validés en test.
6. **Photo de profil** : demandé mais non commencé — nécessite `expo-image-picker` + Firebase Storage (dépendances natives → rebuild).

---

## 9. Prochaine étape recommandée

1. Déployer règles + index Firestore (section 2)
2. Diagnostiquer le bug duel en ligne (section 7) avec les logs `[DUEL-DEBUG]`
3. Tester F01 de bout en bout (2 appareils, comptes réels)
4. Attaquer F16 + F18 (bugs jetons — prioritaires)
5. Trancher F04 / F08 / F22 (décisions produit)
