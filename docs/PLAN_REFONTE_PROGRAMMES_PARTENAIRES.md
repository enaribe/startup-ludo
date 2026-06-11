# Plan de refonte - Programmes partenaires

## Objectif

Refondre la fonctionnalite actuelle `programme/challenge` pour passer d'une logique centree sur un challenge unique a une logique :

- un partenaire peut proposer plusieurs programmes ;
- chaque programme possede ses propres contenus de jeu ;
- l'utilisateur peut tester un programme avec une premiere partie contre l'IA ;
- apres cette premiere partie, l'application lui propose de s'inscrire pour continuer.

La refonte doit rester separee des autres modes de jeu deja developpes :

- jeu local classique ;
- jeu en ligne ;
- match rapide ;
- invitations ;
- editions classiques par secteur ;
- moteur de plateau Ludo ;
- cartes evenement du jeu, dont le type `challenge`.

## Point important : deux sens du mot challenge

Dans le code actuel, `challenge` signifie deux choses differentes :

1. Programme d'accompagnement : `src/types/challenge.ts`, `useChallengeStore`, `src/app/(challenges)`.
2. Carte evenement negative du jeu : `EventType = 'challenge'`, `ChallengeEvent`, `EventManager.generateChallengeEvent`.

La refonte doit renommer la couche programme vers `program`, mais ne doit pas renommer le type d'evenement `challenge` du jeu.

Decision recommandee :

- conserver `challenge` pour les cartes evenement ;
- introduire `program` pour les parcours partenaires ;
- eviter les nouveaux noms comme `challengeId` pour les parcours.

## Sauvegarde de l'existant

Avant modification, sauvegarder la fonctionnalite actuelle.

Option recommandee :

- creer une branche Git : `backup/programmes-legacy-2026-06-09`

Elements a sauvegarder :

- `src/app/(challenges)/`
- `src/components/challenges/`
- `src/data/challenges/`
- `src/stores/useChallengeStore.ts`
- `src/types/challenge.ts`
- `src/hooks/useChallengeEnroll.ts`
- `src/services/firebase/challengeService.ts`
- fonctions Firestore liees a `challengeEnrollments`

Le dossier `challenge-backup-original` a deja ete supprime. La sauvegarde doit donc etre faite a partir du code actif actuel.

## Architecture cible

La nouvelle couche programme doit etre au-dessus du jeu, pas melangee au moteur.

Structure cible :

1. `Partner`
2. `Program`
3. `ProgramContentPack`
4. `ProgramEnrollment`
5. `ProgramTrial` ou `ProgramSession`
6. `ProgramGameContext`

Le moteur de jeu reste responsable de :

- deplacement des pions ;
- tours ;
- captures ;
- evenements de case ;
- resolution des quiz, opportunites, challenges, financements, duels ;
- mode solo/local/online.

La couche programme doit seulement configurer :

- quel contenu injecter dans la partie ;
- quel adversaire IA creer ;
- quelles regles d'acces appliquer ;
- quelle progression programme mettre a jour apres la partie.

## Ce qui doit rester intact

Ne pas refondre ces parties dans ce chantier :

- `src/app/(game)/local-setup.tsx`
- `src/app/(game)/online-setup.tsx`
- `src/app/(game)/quick-match.tsx`
- `src/app/(game)/create-room.tsx`
- `src/app/(game)/join-room.tsx`
- `src/app/(game)/lobby/[roomId].tsx`
- `src/app/(game)/game-preparation.tsx`
- `src/hooks/useOnlineGame.ts`
- `src/services/multiplayer/`
- synchronisation Realtime Database
- logique de mise en ligne/local

Ces parcours doivent continuer a utiliser les editions classiques existantes.

## Ce qui peut etre reutilise

La refonte doit reutiliser ce qui existe deja :

- `GameStore.initGame`
- `GameState.challengeContext`, a remplacer ou etendre vers un contexte programme
- `EventManager.setSubLevelContent`
- `SubLevelContentPack`
- le mode `solo` avec joueur humain + IA
- `src/app/(game)/challenge-game.tsx`, a transformer en ecran de lancement programme
- `src/app/(game)/play/[gameId].tsx`
- `src/app/(game)/results/[gameId].tsx`
- les popups existantes de quiz, funding, opportunity, challenge et duel

Le bon sens technique est d'adapter l'injection de contenu, pas de reecrire le jeu.

## Nouveau modele de types

Creer `src/types/program.ts`.

Types principaux :

- `ProgramPartner`
- `PartnerProgram`
- `ProgramAudience`
- `ProgramContentPack`
- `ProgramEnrollment`
- `ProgramTrial`
- `ProgramSession`
- `ProgramGameContext`
- `ProgramPlayAccess`

Exemple de responsabilites :

- `ProgramPartner` : nom, logo, bannieres, couleur, description.
- `PartnerProgram` : nom, partenaire, visuels, description, cible, zones, secteur, statut actif.
- `ProgramContentPack` : quiz, duels, fundings, opportunities, challengeEvents.
- `ProgramEnrollment` : inscription utilisateur a un programme.
- `ProgramTrial` : premiere partie gratuite deja consommee ou non.
- `ProgramGameContext` : contexte transmis au jeu pour charger le bon contenu.

## Migration du contexte de jeu

Actuellement :

- `GameState.challengeContext?: ChallengeContext`
- `ChallengeContext` contient `challengeId`, `enrollmentId`, `levelNumber`, `subLevelNumber`, `sectorId`.
- `useGameStore.initGame` lit ce contexte puis charge le contenu du sous-niveau dans `EventManager`.

Nouvelle cible :

- ajouter `ProgramGameContext` ;
- garder temporairement `challengeContext` pour compatibilite pendant la transition ;
- faire evoluer `initGame` pour accepter un contexte programme ;
- charger un `ProgramContentPack` depuis ce contexte ;
- laisser le reste du moteur inchangé.

Exemple cible :

```ts
type GameOrigin = 'classic' | 'program';

interface ProgramGameContext {
  origin: 'program';
  partnerId: string;
  programId: string;
  enrollmentId?: string | null;
  sessionId: string;
  isTrial: boolean;
  contentPackId?: string;
}
```

## Donnees locales programmes

Creer une nouvelle source de donnees :

- `src/data/programs/index.ts`
- `src/data/programs/partners.ts`
- `src/data/programs/mastercard.ts`
- `src/data/programs/yeah.ts`
- `src/data/programs/meliteji-wasu.ts`

Ne pas supprimer immediatement `src/data/challenges/`. Le garder pendant la migration, puis le retirer quand aucun import actif n'en depend.

Chaque programme doit contenir :

- `id`
- `partnerId`
- `name`
- `slug`
- `description`
- `heroImageUrl`
- `bannerUrl`
- `playerCount`
- `sessionCount`
- `audience`
- `locations`
- `sector`
- `tags`
- `isActive`
- `contentPacks`
- `rules`

## Store

Creer `src/stores/useProgramStore.ts`.

Responsabilites :

- charger partenaires et programmes ;
- recuperer les programmes par partenaire ;
- suivre le programme actif ;
- suivre les inscriptions ;
- suivre les sessions jouees ;
- determiner si la premiere partie gratuite est disponible ;
- enregistrer une session programme ;
- synchroniser avec Firebase.

Ne pas melanger ce store avec `useGameStore`.

`useGameStore` doit rester centre sur la partie en cours.

## Acces a la premiere partie

Centraliser la logique dans un helper ou dans `useProgramStore`.

Regles :

- utilisateur non inscrit + aucune session sur ce programme : peut jouer une partie d'essai ;
- utilisateur non inscrit + session deja jouee : afficher inscription obligatoire ;
- utilisateur inscrit : peut continuer selon les regles du programme ;
- utilisateur invite : decision produit a confirmer, mais il faut eviter de creer une inscription persistante sans compte.

Nom possible :

```ts
getProgramPlayAccess(programId, userId)
```

Retour possible :

```ts
{
  canPlay: boolean;
  reason: 'trial_available' | 'enrolled' | 'trial_used' | 'guest_blocked';
  requiresEnrollment: boolean;
}
```

## Firebase

Ne pas casser les collections existantes pendant la transition.

Collections actuelles :

- `challenges`
- `challengeEnrollments`

Collections cible :

- `partners`
- `programs`
- `programEnrollments`
- `programSessions`

Migration progressive :

1. ajouter les nouvelles constantes dans `FIRESTORE_COLLECTIONS` ;
2. creer `programService.ts` ;
3. garder `challengeService.ts` tant que les anciens ecrans existent ;
4. brancher les nouveaux ecrans sur `programService.ts` ;
5. supprimer les anciennes collections cote app seulement quand les routes ne les utilisent plus.

## Ecrans cible

Nouvelle structure recommandee :

- `src/app/(programs)/_layout.tsx`
- `src/app/(programs)/partner/[partnerId].tsx`
- `src/app/(programs)/[programId].tsx`
- `src/app/(programs)/play/[programId].tsx`
- `src/app/(programs)/enroll/[programId].tsx`

Alternative plus rapide :

- reutiliser temporairement `src/app/(challenges)` en changeant le contenu ;
- renommer ensuite vers `(programs)` quand la migration est stable.

Option recommandee : creer `(programs)` pour eviter la confusion.

## Accueil

Modifier uniquement la section programme de `src/app/(tabs)/home.tsx`.

Ne pas toucher :

- bouton `Nouvelle partie` ;
- stats joueur ;
- portfolio ;
- classement ;
- profil ;
- onboarding ;
- retour bonus ;
- mode invite hors besoin direct.

Remplacer `ChallengeHomeCard` par une carte programme/partenaire.

La carte doit afficher :

- visuel programme ou partenaire ;
- partenaire ;
- nombre de parcours actifs ou nombre de joueurs ;
- bouton `Participer`, `Jouer` ou `Continuer` selon l'etat ;
- pagination/carrousel si plusieurs programmes.

## Liste partenaire

L'ecran partenaire doit afficher :

- banniere partenaire ;
- logo partenaire ;
- liste des programmes actifs ;
- carte par programme ;
- bouton `Jouer` ou `Voir`.

Exemples :

- Young Africa Works
- YEAH
- Meliteji Wasu

## Detail programme

L'ecran detail doit afficher :

- image principale ;
- logos partenaire/programme ;
- nombre de joueurs ;
- nom du programme ;
- description ;
- cible ;
- zones ;
- secteur ;
- profil vise ;
- ce qui attend le joueur ;
- bouton `Jouer`, `Continuer` ou `S'inscrire`.

## Lancement contre l'IA

Creer un flux dedie programme, sans passer par le local/online setup.

Le bouton `Jouer` doit :

1. verifier l'acces via `getProgramPlayAccess` ;
2. creer une session programme locale ;
3. creer deux joueurs : humain + IA ;
4. appeler `initGame('solo', edition, players, programGameContext)` ;
5. injecter le contenu du programme dans `EventManager` ;
6. naviguer vers `/(game)/play/[gameId]`.

Ce flux peut reutiliser la logique actuelle de `src/app/(game)/challenge-game.tsx`, mais il doit etre renomme conceptuellement en `program-game`.

## EventManager

Le mecanisme actuel `setSubLevelContent` est utile.

Modification recommandee :

- renommer ou generaliser `SubLevelContentPack` vers `GameContentPack` ;
- garder une compatibilite temporaire avec `SubLevelContentPack` ;
- ne pas changer la forme des evenements de jeu ;
- ne pas renommer `challengeEvents`, car cela designe les cartes challenge negatives.

Le moteur doit pouvoir choisir ses cartes depuis :

1. contenu programme si `ProgramGameContext` existe ;
2. contenu edition classique sinon.

## Resultats et progression

Adapter `src/app/(game)/results/[gameId].tsx` pour detecter l'origine de la partie.

Si partie classique :

- comportement actuel.

Si partie programme :

- enregistrer `ProgramSession` ;
- marquer la premiere partie gratuite comme consommee ;
- si l'utilisateur n'est pas inscrit, afficher une proposition d'inscription ;
- si l'utilisateur est inscrit, mettre a jour sa progression programme ;
- ne pas casser l'XP global si le comportement actuel doit rester.

## Inscription

L'inscription doit devenir une inscription a un programme, pas a un challenge.

Creer ou adapter :

- `ProgramEnrollmentFormModal`
- `useProgramEnroll`

Regle :

- ne creer l'enrollment qu'apres soumission du formulaire ;
- sauvegarder dans `programEnrollments` ;
- conserver localement si offline ;
- synchroniser quand Firebase est disponible.

## Nettoyage progressif

Ne pas supprimer toute la fonctionnalite challenge en une seule passe.

Ordre recommande :

1. introduire `program` en parallele ;
2. brancher l'accueil sur `program` ;
3. creer les nouveaux ecrans `(programs)` ;
4. faire fonctionner une partie programme contre IA ;
5. brancher inscription et premiere partie gratuite ;
6. verifier que local/online/match rapide fonctionnent encore ;
7. supprimer l'ancien `useChallengeStore` et `src/app/(challenges)` seulement quand plus aucun import actif ne les utilise.

## Fichiers probablement touches

Ajouts :

- `src/types/program.ts`
- `src/data/programs/*`
- `src/stores/useProgramStore.ts`
- `src/hooks/useProgramEnroll.ts`
- `src/services/firebase/programService.ts`
- `src/app/(programs)/*`
- nouveaux composants dans `src/components/programs/*`

Modifications ciblees :

- `src/app/(tabs)/home.tsx`
- `src/app/_layout.tsx`
- `src/types/index.ts`
- `src/stores/useGameStore.ts`
- `src/services/game/EventManager.ts`
- `src/services/firebase/config.ts`
- `src/app/(game)/results/[gameId].tsx`

Fichiers a eviter sauf necessite :

- `src/hooks/useOnlineGame.ts`
- `src/services/multiplayer/*`
- `src/app/(game)/online-setup.tsx`
- `src/app/(game)/local-setup.tsx`
- `src/app/(game)/game-preparation.tsx`

## Ordre recommande d'execution

1. Creer une branche backup de l'ancien systeme.
2. Auditer les imports `useChallengeStore`, `ALL_CHALLENGES`, `ChallengeContext`.
3. Ajouter les types `program`.
4. Ajouter les donnees locales partenaires/programmes.
5. Ajouter `useProgramStore`.
6. Ajouter les services Firebase programmes sans supprimer les anciens.
7. Creer les composants `ProgramHomeCard`, `ProgramCard`, `PartnerHeader`.
8. Modifier seulement la section programme de l'accueil.
9. Creer la page partenaire.
10. Creer la page detail programme.
11. Creer le lancement programme contre IA.
12. Generaliser l'injection de contenu dans `EventManager`.
13. Adapter `useGameStore.initGame` pour `ProgramGameContext`.
14. Adapter les resultats programme.
15. Ajouter la premiere partie gratuite.
16. Ajouter l'inscription programme.
17. Tester les parcours programme.
18. Tester les parcours local/en ligne existants.
19. Supprimer les anciens ecrans challenge quand ils ne sont plus utilises.

## Verifications minimales

Programmes :

- l'accueil affiche les programmes ;
- un partenaire affiche plusieurs programmes ;
- le detail programme est accessible ;
- `Jouer` lance une partie contre l'IA ;
- la partie utilise uniquement le contenu du programme ;
- la premiere partie est autorisee sans inscription ;
- une deuxieme partie demande l'inscription ;
- l'inscription debloque la suite ;
- la session programme est sauvegardee.

Non-regression jeu :

- nouvelle partie locale fonctionne ;
- partie solo/classique fonctionne ;
- partie en ligne fonctionne ;
- match rapide fonctionne ;
- les cartes quiz/funding/opportunity/challenge classiques fonctionnent ;
- les duels restent synchronises ;
- les contenus par edition classique restent disponibles ;
- les resultats classiques restent inchanges.

## Conclusion technique

La refonte ne doit pas etre une reecriture du jeu.

La bonne approche est :

- nouvelle couche `program` pour partenaires, programmes, inscriptions et sessions ;
- reutilisation du moteur existant ;
- injection de contenu programme dans `EventManager` ;
- separation stricte avec les modes local/en ligne ;
- migration progressive pour eviter de casser les parcours deja stables.

