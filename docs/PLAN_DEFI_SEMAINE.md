# Plan — Défi de la semaine

État au 7 octobre 2026. Deux dépôts concernés :

- **Mobile** : `startup-ludo`
- **Admin** : `startup-ludo-admin-github` (celui qui tourne, pas `startup-ludo-admin`)

---

## 1. Ce qu'on construit

Chaque semaine, CONCREE publie un **thème entrepreneurial** — financer son stock,
entreprendre après les inondations, se formaliser. Tous les joueurs s'affrontent
dessus pendant sept jours sur un contenu dédié. Le dimanche soir, un classement
désigne un champion. Lundi, nouveau thème, compteurs à zéro.

**L'actualité sert de porte d'entrée, pas de sujet.** « Entreprendre après les
inondations » parle de trésorerie, d'assurance, de reconstruction d'activité :
c'est de l'entrepreneuriat, raconté avec ce qui préoccupe les gens cette
semaine-là.

---

## 2. Ce qui existe déjà — plus que prévu

| Brique | État | Où |
|---|---|---|
| Classement hebdomadaire | **écrit, non exposé** | `userStats.weeklyXP`, `getLeaderboard('weekly')` |
| Remise à zéro du lundi | **écrite, non déployée** | `functions/src/user/updateLeaderboard.ts:85` |
| Notification à UN joueur | en production | `onGameInvitationCreated` |
| Notification à TOUS | **n'existe pas** | aucun topic FCM, aucun broadcast |
| Pack de contenu de jeu | en production | `EventManager.setContentPack()` |
| Catalogue publié par CONCREE | en production | patron `readySessions` |
| Génération IA d'un pack complet | en production | `class_session_content` |
| Score d'une partie | en production | `updateUserStats` |

### Les trois trouvailles qui changent le chiffrage

**`weeklyXP` est déjà alimenté à chaque partie.** `updateUserStats`
(`src/services/firebase/firestore.ts:307`) l'incrémente, et `getLeaderboard`
sait le trier (l.499). Mais **aucun écran ne l'affiche** : l'onglet Classement
ne propose que le cumul global.

**Le cycle hebdomadaire est déjà écrit.** `resetWeeklyStats`, programmée
`0 0 * * 1` (chaque lundi minuit UTC), remet `weeklyXP` à zéro pour tous les
joueurs. Elle compile. L'en-tête de `functions/src/index.ts` dit simplement :
« Ces fonctions sont prêtes mais non déployées ».

**Le patron de publication existe.** `readySessions` fait exactement ce qu'il
faut : CONCREE prépare un contenu, le génère **une fois** et le fige, puis le
publie sous double condition `active && !!contenu`. Son commentaire porte la
leçon à reprendre — « une séance annoncée "prête à l'emploi" qui n'a rien à
jouer est pire qu'une séance absente ».

---

## 3. Décisions de modèle

### Le nom : `weeklyChallenges`, pas `challenges`

Le mot est **déjà pris**. `challenges` désigne l'ancien modèle YEAH Program
(`ChallengeProgram`, écrans `/challenges`), et `challengeEvents` les cartes à
jetons négatifs. Côté interface : « Défi de la semaine ».

### Une collection dédiée, calquée sur `readySessions`

```ts
interface WeeklyChallenge {
  id: string;                    // 'wc_2026-10-13'
  titre: string;                 // « Financer son stock »
  accroche: string;              // une phrase affichée sur l'accueil
  visuelUrl?: string;
  editionId: string;             // édition support
  consignes?: string;            // rejouables pour régénérer
  contenu?: ClassSessionContent; // généré UNE fois, figé
  ouvreLe: number;               // lundi 00:00, ms epoch
  fermeLe: number;               // dimanche 23:59:59
  active: boolean;
  championUid?: string;          // figé à la clôture
  championNom?: string;
  createdAt: number;
  updatedAt: number;
}
```

**Pourquoi pas une édition temporaire** : `EditionData` n'a aucun champ de date,
seulement `enabled`. Une édition est un univers permanent. Les périodes datées
existent sur `Campaign.period` et `ClassSession`, jamais sur les éditions.

**Pourquoi le contenu est figé** : même raison que `readySessions` — générer à
chaque partie coûterait un appel modèle, prendrait plusieurs secondes, et
donnerait un contenu différent à chaque joueur. Un classement suppose que tous
jouent le **même** contenu.

### Le score : `weeklyXP`, pas un compteur neuf

On réutilise ce qui existe. Un nouveau compteur demanderait d'écrire dans
`userStats` à chaque partie, de le remettre à zéro, et de le trier — tout ce que
`weeklyXP` fait déjà.

⚠️ **Seules les parties jouées SUR le défi doivent compter.** Aujourd'hui
`weeklyXP` est incrémenté par toute partie. Il faut donc soit un second
compteur `defiXP`, soit un filtre à l'écriture. C'est le point le plus délicat
du plan — voir Lot 3.

---

## 4. Les lots

### Lot 0 — Déployer les Cloud Functions (bloquant, ~1 h)

Rien ne fonctionne sans l'ordonnanceur.

- Vérifier que `resetWeeklyStats` compile (`npx tsc --noEmit` dans `functions/`)
- `firebase deploy --only functions:resetWeeklyStats`
- Vérifier dans la console que le cron est programmé

⚠️ Les callables legacy sont exclus du build (API v1/v2 incompatibles) — ne pas
tenter un déploiement global.

**Décalage horaire** : le cron est en UTC. À Dakar (UTC+0) c'est bien minuit ;
à vérifier si la cible s'élargit.

### Lot 1 — Le modèle et la collection (~2 h)

- Type `WeeklyChallenge` dans les deux dépôts
- `COLLECTIONS.weeklyChallenges` des deux côtés
- Règle Firestore, calquée sur `readySessions` :

```
match /weeklyChallenges/{wid} {
  allow read: if isAuthenticated();
  allow write: if isSuperAdmin();
}
```

⚠️ Le fichier `firestore.rules` a déjà des modifications non déployées. Vérifier
avant `firebase deploy --only firestore:rules`.

### Lot 2 — Le back-office (~6 h)

Décalque de `seances-pretes`, écran par écran :

- **Liste** `/defis-semaine` — un défi par ligne, dates, état, résumé du contenu
  (`resumeContenu` existe déjà)
- **Préparation** `/defis-semaine/[id]` — titre, accroche, dates, mix,
  génération, **relecture et correction**
- Réutiliser `ApercuContenuSeance` et `AjoutContenuSeance` tels quels
- Génération par `genererContenuSeance` avec le type `class_session_content`

**Menu super-admin** — quatre modifications coordonnées dans
`SuperAdminLayout.tsx` : `GROUPES` (groupe « CONTENU DU JEU »),
`titreDepuisChemin`, et le badge si besoin.

### Lot 3 — Le score du défi (~4 h) — **le point sensible**

Il faut qu'une partie compte pour le défi **seulement si elle est jouée sur le
défi**.

Deux voies :

**(a) Un champ `defiId` dans le contexte de partie.** `initGame` le reçoit comme
il reçoit déjà `programContext` et `classContext`. `updateUserStats` écrit alors
dans `defiXP` plutôt que dans `weeklyXP`.

**(b) Réutiliser `weeklyXP` tel quel.** Plus simple, mais toute partie compte —
le classement ne mesure plus le défi, il mesure l'activité de la semaine.

**Recommandation : (a).** La promesse « le roi du défi » n'a de sens que si le
classement porte sur le défi. Sinon, autant ne pas parler de thème.

Conséquence : `resetWeeklyStats` doit aussi remettre `defiXP` à zéro.

### Lot 4 — L'écran mobile (~8 h)

**Sur l'accueil** (`src/app/(tabs)/home.tsx`, entre les lignes 393 et 396) :
une carte entre « Nouvelle partie » et « PARTENAIRES ». Thème en cours, jours
restants, position du joueur.

Le motif de section existe déjà (`challengeHeader`, `challengeCardWrapper`).

**Écran du défi** — classement vivant, position du joueur, bouton « Jouer ».

**i18n** : ~15 clés `defi.*` dans **`fr.ts` ET `en.ts`** (fichiers plats tenus
en parallèle ligne à ligne).

### Lot 4bis — La diffusion des notifications (~4 h)

**Ce lot manquait à la première version de ce plan.** Vérification faite : la
seule Cloud Function d'envoi (`onGameInvitationCreated`) cible **un
destinataire**, et il n'existe aucun topic FCM ni aucun mécanisme de diffusion.

Deux voies :

**(a) Topic FCM `defi-semaine`.** L'app s'abonne au démarrage, la fonction
publie sur le topic. Un seul appel quel que soit le nombre de joueurs, et le
désabonnement est géré par FCM.

**(b) Parcourir `pushTokens`.** La règle est `allow read: if isOwner(userId)` —
seul l'Admin SDK peut lister la collection, donc c'est faisable côté Cloud
Function. Mais il faut paginer, et `sendEachForMulticast` est plafonné à 500
jetons par appel.

**Recommandation : (a).** Le topic ne coûte ni lecture Firestore ni pagination,
et il survit aux réinstallations.

### Lot 5 — L'ouverture et la clôture automatiques (~4 h)

Une Cloud Function `cloturerDefiSemaine`, programmée le dimanche soir :

- Lit le classement `defiXP`
- Écrit `championUid` / `championNom` sur le défi qui se termine
- Bascule `active` sur le défi suivant
- Envoie une notification « le champion est… » puis « nouveau défi lundi »

⚠️ **Ordre impératif** : figer le champion **avant** que `resetWeeklyStats`
n'efface les scores. Le lundi 00:00 UTC arrive après le dimanche 23:59 — mais
l'écart est d'une minute. Programmer la clôture le **dimanche 23:00**.

### Lot 6 — La trace du champion (~3 h)

- Badge sur le profil (`achievements` existe)
- Mise en avant sur l'accueil pendant la semaine suivante

**Un précédent à ne pas reproduire.** Le modèle legacy a déjà un champ
`ChallengeEnrollment.championStatus` (`'local' | 'regional' | 'national' | null`,
`src/types/challenge.ts:131`) et même une action pour l'écrire
(`useChallengeStore.ts:301`). Mais :

- **aucun écran n'appelle cette action** — le champ reste à `null` partout ;
- `useChallengeStore` ne persiste qu'en **`AsyncStorage`** (`partialize`, ligne
  ~317), jamais en Firestore. Un statut écrit là disparaîtrait au changement
  d'appareil.

Le champion de la semaine doit donc être **un document Firestore**, écrit par la
Cloud Function de clôture du lot 5 — pas un état de store. Le store peut le
lire ; il ne doit pas en être la source.

---

## 5. Ordre et dépendances

```
Lot 0 (Functions déployées)  ─── BLOQUANT
   └─ Lot 1 (modèle + règles)
        ├─ Lot 2 (back-office)      ─┐
        └─ Lot 3 (score du défi)    ─┤
             └─ Lot 4 (écran mobile) ┘
                  ├─ Lot 4bis (diffusion push)
                  └─ Lot 5 (clôture auto)
                       └─ Lot 6 (champion)
```

Les lots 2 et 3 sont parallélisables. Le lot 4 ne peut être **testé** qu'après
le 2 (il faut un défi à afficher).

Le lot 4bis est **indépendant du lot 5** : le défi fonctionne sans notification,
seule l'audience de l'ouverture en souffre. À sacrifier en premier si le délai
se tend.

---

## 6. Estimation

| Lot | Charge |
|---|---|
| 0 — Déploiement Functions | 1 h |
| 1 — Modèle et règles | 2 h |
| 2 — Back-office | 6 h |
| 3 — Score du défi | 4 h |
| 4 — Écran mobile | 8 h |
| 4bis — Diffusion des notifications | 4 h |
| 5 — Clôture automatique | 4 h |
| 6 — Champion | 3 h |
| **Total** | **~32 h, soit 4 à 5 jours** |

Sans le lot 6 (qui peut suivre) : **~29 h**.

---

## 7. Risques

| Risque | Gravité | Traitement |
|---|---|---|
| **Le contenu chaque semaine** | **haute** | six thèmes prêts avant le lancement |
| Classement désert au premier défi | haute | lancer avec une campagne, pas une notification |
| Essoufflement après 3 semaines | haute | s'engager sur 12 semaines, puis décider |
| Functions jamais déployées | **bloquante** | Lot 0 en premier, vérifié en console |
| Clôture après la remise à zéro | haute | dimanche 23:00, pas lundi 00:00 |
| `weeklyXP` pollué par les parties hors défi | moyenne | compteur `defiXP` séparé (Lot 3a) |
| Fuseau horaire du cron | faible | UTC = Dakar aujourd'hui |

---

## 8. Ce que le plan ne fait pas

- **Pas de sponsoring de défi** — la piste commerciale est réelle, mais elle
  demande un circuit de facturation. À traiter après avoir prouvé l'audience.
- **Pas de récompense en jeu** — le titre et le badge suffisent au pilote.
- **Pas de défi par établissement** — un seul défi national.

---

## 9. La question préalable

**Qui produit le thème chaque semaine, et est-ce tenable sur trois mois ?**

Si la réponse n'est pas ferme, le reste ne vaut pas la peine d'être construit :
c'est le seul point où la fonctionnalité peut échouer après avoir été livrée.
Un défi abandonné au bout de trois semaines fait plus de mal que pas de défi —
les joueurs qui reviennent trouvent un classement mort.
