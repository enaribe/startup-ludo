# Plan — Prolongement (devoir maison) : web + mobile

> ## ⏸️ STATUT : GELÉ — affichage retiré le 24/09/2026
>
> La fonctionnalité n'était pas implémentée : le drapeau existait sur la séance,
> mais aucun écran mobile ne présentait le devoir et aucun rendu n'était mesuré.
> Le rapport affichait un « 0 / n » et une barre à 3 % codés en dur, qui
> laissaient croire à une mesure inexistante.
>
> **Ce qui a été retiré** (commit du 24/09/2026) : la carte « Prolongement
> assigné » du rapport, la colonne PROLONGEMENT du tableau consolidé, la tuile
> « Prolongements assignés » de la fiche de classe, le bloc du PDF de rapport,
> la mention du PDF de bilan, et l'interrupteur du wizard de création.
>
> **Ce qui a été conservé** : le champ `prolongement?: { actif, dateLimite }`
> dans `ClassSession` (types admin) et les séances qui le portent déjà en base.
> Rien n'est perdu — seul l'affichage a disparu.
>
> **Question de conception NON TRANCHÉE, à régler avant toute reprise :**
> sous quelle forme le devoir se joue-t-il sur le téléphone ? L'app n'a
> aujourd'hui **aucun écran de quiz autonome** — toute question passe par une
> partie de plateau complète contre ADIA (`my-classes.tsx:113-158`). Trois
> voies : (a) un écran de quiz enchaîné sans plateau, ~5 min, le sens même d'un
> devoir maison, mais un écran à créer ; (b) réutiliser la partie de plateau
> telle quelle, coût nul mais 15-20 min pour un devoir du soir ; (c) un plateau
> raccourci, qui touche à la condition de fin du moteur. Le chiffrage du Lot 3
> ci-dessous suppose la voie (a).
>
> Restent aussi ouverts : le point d'entrée (accueil / « Ma classe » / push) et
> ce que l'élève voit après avoir rendu (score seul / score + notions à revoir /
> correction détaillée).


État au 24 septembre 2026. Deux dépôts concernés :

- **Admin** : `startup-ludo-admin-github` (celui qui tourne sur `:3001` — pas `startup-ludo-admin`)
- **Mobile** : `startup-ludo`

---

## 1. Où on en est vraiment

Le prolongement existe aujourd'hui comme **un drapeau sans contenu et sans mesure** :

```ts
// startup-ludo-admin-github/src/types/index.ts:1183-1187
prolongement?: { actif: boolean; dateLimite?: string };
```

Écrit à un seul endroit (`seances/nouvelle/page.tsx:391-393`), à la création de la séance, **activé par défaut avec une échéance à J+7**.

Le taux de complétion est **codé en dur à zéro en quatre endroits** :

| Fichier | Ligne | Ce qui est affiché |
|---|---|---|
| `RapportSeance.tsx` | 113 | `faits: 0` (export PDF) |
| `RapportSeance.tsx` | 433 | barre de progression `width: '3%'` |
| `RapportSeance.tsx` | 437 | `<strong>0</strong> / {effectifClasse}` |
| `rapports/page.tsx` | 345 | `0 / ${l.effectif}` |

Côté mobile : **rien**. Aucune collection, aucun type, aucune clé i18n, aucun écran. Le mot n'apparaît que dans deux commentaires sans rapport.

Conséquence nette : les profs assignent des devoirs que **personne ne peut faire**, et le rapport affiche une barre remplie à 3 % qui ne mesure rien.

---

## 2. Les deux verrous d'architecture

Ce sont eux qui déterminent la forme du plan. Ils ne sont pas négociables, ils sont dans le code.

### Verrou n°1 — l'élève ne voit une séance que si `status == 'running'`

```
// firestore.rules:843-845 (classSessions)
|| (isAuthenticated()
    && resource.data.status == 'running'
    && eleveRattacheA(resource.data.classId));
```

Et pareil sur le contenu (`firestore.rules:936-939`). Or un prolongement se fait **après** la séance, quand `status == 'ended'`.

Le type le dit noir sur blanc (`types/index.ts:1100-1101`) : *« `running` : c'est le SEUL état où l'élève voit la séance et peut y écrire »*.

**Sans modification des règles, le prolongement est structurellement impossible.**

### Verrou n°2 — la requête mobile filtre aussi sur `running`

```ts
// classService.ts:444-448
where('classId', '==', classId),
where('status', '==', 'running')
```

Même si les règles s'ouvraient, l'app ne verrait toujours rien.

### Précédent à respecter

Le code documente explicitement (`types/index.ts:1166-1177`) pourquoi `startedPlayingAt` est **un champ et non un quatrième `status`** : ajouter un état aurait obligé à réviser chaque règle, chaque requête et chaque écran.

**Le plan suit ce précédent : on n'ajoute pas de `status`.** On ouvre une porte étroite, conditionnée au prolongement lui-même.

---

## 3. Ce qu'on réutilise (l'essentiel existe)

C'est la bonne nouvelle : presque tout le socle est là.

| Brique | Où | Réutilisation |
|---|---|---|
| Identité élève inviolable | `classLinks/{uid}` → `{classId, learnerId}`, `allow write: if false` | telle quelle |
| Règle « c'est bien cet élève » | `estCetEleve(sid, learnerId)` dans `firestore.rules` | telle quelle |
| Stockage par élève × séance | `classSessions/{sid}/participants/{learnerId}` | on y ajoute un champ |
| Écriture additive tolérante au hors-ligne | `enregistrerReponse()` + `arrayUnion` | on la décalque |
| Forme d'une réponse | `ClassAnswer { quizId, category, correct, answeredAt }` | identique |
| Contenu de séance | `classSessions/{sid}/content/generated` | on rejoue les quiz |
| Popup de question | `QuizPopup.tsx` | tel quel |
| Contexte de jeu | `ClassGameContext` | + un drapeau |
| Agrégation par notion | `agregerNotions()`, `compteursDepuisReponses()` | telles quelles |
| Champ PDF | `prolongement: { dateLimite, faits, total }` | **déjà prêt**, il attend de vrais chiffres |

---

## 4. Décision de modèle

### Le prolongement rejoue les quiz de la séance

Pas de génération IA supplémentaire. Le contenu existe déjà dans `content/generated`, il est pédagogiquement pertinent (c'est le cours du jour), et ça évite un second circuit de génération, de relecture et de coût.

**Option ouverte pour plus tard** : ne rejouer que les notions ratées, ce que `agregerNotions()` sait déjà calculer.

### Où stocker le rendu

Dans le document participant existant, sous une clé dédiée :

```ts
// Ajout à ClassSessionParticipant (types/index.ts:1285)
prolongement?: {
  answers: ClassParticipantAnswer[];  // arrayUnion, même forme que `answers`
  startedAt?: number;
  finishedAt?: number;                // présent = « rendu », c'est ce qui compte
};
```

**Pourquoi pas une sous-collection dédiée** : le document participant est déjà la granularité « un élève × une séance », il est déjà lisible par le prof, déjà couvert par `estCetEleve()`, et déjà protégé contre la suppression. Une collection parallèle dupliquerait les trois règles.

**Pourquoi un objet imbriqué et pas des champs à plat** : `finishedAt` existe déjà pour la partie en classe. Les confondre casserait le rapport.

**La définition de « fait »** : `prolongement.finishedAt` présent. Pas « a répondu à une question » — sinon le taux monte dès qu'un élève ouvre le devoir.

---

## 5. Les lots

### Lot 0 — arrêter le faux signal (30 min, indépendant)

À faire **tout de suite**, quelle que soit la suite : aujourd'hui la barre à 3 % laisse croire à une mesure.

- `RapportSeance.tsx:431-433` — supprimer la barre en dur
- Garder la phrase « le comptage arrive avec la prochaine version de l'app »

Si le reste du plan n'est pas lancé, envisager aussi de **décocher le prolongement par défaut** dans le wizard (`seances/nouvelle/page.tsx:156`) — assigner par défaut un devoir infaisable est la vraie anomalie.

### Lot 1 — règles Firestore (mobile, `firestore.rules`)

La porte étroite. Deux règles à étendre :

```
// classSessions/{sid} — lecture élève
|| (isAuthenticated()
    && resource.data.status == 'running'
    && eleveRattacheA(resource.data.classId))
// AJOUT : séance terminée AVEC prolongement actif non échu
|| (isAuthenticated()
    && resource.data.status == 'ended'
    && resource.data.get('prolongement', {}).get('actif', false) == true
    && eleveRattacheA(resource.data.classId))
```

Même ajout sur `content/{document=**}` (l.936-939).

Points de vigilance :

- **`get('prolongement', {})`** et non un accès direct : la clé est absente sur la quasi-totalité des séances, un accès direct **ferait échouer** l'évaluation au lieu de refuser. C'est la précaution déjà prise partout ailleurs dans ce fichier.
- **La date limite n'est pas contrôlée dans la règle.** Volontairement : `dateLimite` est une chaîne `YYYY-MM-DD`, la comparer à `request.time` en langage de règles est fragile. Le blocage après échéance est fait côté app et côté écriture. Le risque résiduel est qu'un élève lise un contenu déjà joué en classe — négligeable.
- **`participants` n'a besoin d'aucun changement** : `estCetEleve()` ne teste pas le statut de la séance.
- ⚠️ `firestore.rules` a **déjà une modification non commitée et non déployée** (bloc `readySessions`, l.778-786). Le déploiement des règles l'emportera avec. À vérifier avant `firebase deploy --only firestore:rules`.

**Test obligatoire avant de continuer** : sans ce lot, tout le reste échoue silencieusement (les écritures mobiles avalent leurs erreurs par conception).

### Lot 2 — service mobile (`classService.ts`)

Trois ajouts, tous décalqués de l'existant :

```ts
// Requête : séances terminées avec prolongement actif
export async function getProlongementsAFaire(classId: string): Promise<ClassSessionSummary[]>
```

⚠️ **Firestore n'indexe pas les champs imbriqués dans un `where` composé sans index dédié.** Filtrer sur `status == 'ended'` + `classId`, puis **filtrer `prolongement.actif` et la date limite côté client**. La volumétrie le permet (quelques dizaines de séances par classe et par an). Sinon : index composite à déclarer.

```ts
// Écritures, sur le modèle exact de enregistrerReponse / terminerSeance
export function enregistrerReponseProlongement(sessionId, learnerId, reponse: ClassAnswer): void
export function terminerProlongement(sessionId, learnerId, data?: { score?: number }): void
```

Elles passent par `ecrireParticipant()` (merge, `void`, catch silencieux, rejeu hors ligne) — le devoir se fait souvent à la maison, avec un réseau incertain. C'est exactement le cas que ce helper a été écrit pour couvrir.

### Lot 3 — écrans mobile

**a) Liste des devoirs** — `(class)/my-classes.tsx`

Une seconde section sous « SÉANCES EN COURS », même motif de carte (`DynamicGradientBorder`, `sessionCard`), pastille orange au lieu du point rouge « live », avec l'échéance. Un devoir déjà rendu affiche une coche et n'est plus pressable.

**b) Le jeu** — `(game)/play/[gameId].tsx` + `useClassSessionReporter.ts`

Réutiliser le moteur existant. Ajouter au contexte :

```ts
// types/class.ts:227
export interface ClassGameContext {
  origin: 'class';
  …
  prolongement?: boolean;   // ← aiguille le reporter vers les nouvelles écritures
}
```

`useClassSessionReporter` teste ce drapeau et route vers `enregistrerReponseProlongement` / `terminerProlongement`. **Aucun changement dans `handleQuizAnswer`** (`play/[gameId].tsx:1134`) : le point d'accroche est déjà unique et le hook est déjà l'aiguilleur.

**c) Entrée sur l'accueil** — `(tabs)/home.tsx`, vers la ligne 394

Une pastille « 1 devoir à faire » entre « Nouvelle partie » et « Partenaires ». Sans ça, un élève qui ne va jamais dans « Mode classe » ne saura jamais qu'il a un devoir.

**d) i18n** — `~10 clés` `class.homework*` dans **`fr.ts` ET `en.ts`** (fichiers plats tenus en parallèle ligne à ligne).

### Lot 4 — rebrancher l'admin

Aucun nouvel écran. On remplace quatre zéros par de vrais calculs.

```ts
// class-report-service.ts — nouvelle fonction
export function compterProlongements(participants: ClassSessionParticipant[]): {
  faits: number; total: number;
} // faits = participants avec prolongement?.finishedAt
```

- `RapportSeance.tsx:113` → `faits: compte.faits`
- `RapportSeance.tsx:431-438` → barre proportionnelle réelle + compteur
- `rapports/page.tsx:345` → vrai ratio. **Vérifié** : la page charge déjà `getParticipants(s.id)` par séance (l.94) pour calculer participation et score. Le comptage des rendus se déduit du tableau déjà en mémoire — aucune lecture Firestore supplémentaire.
- `lib/rapport-session-pdf.ts` → **rien à faire**, il consomme déjà `faits`/`total`

### Lot 5 — contrôle du prolongement par le prof

Manque aujourd'hui, et se verra dès que la fonctionnalité vivra :

- Modifier la date limite / désactiver après coup (`updateSession` l'accepte déjà techniquement, aucun écran ne l'utilise)
- Voir **qui** a rendu, pas seulement combien — la colonne existe dans le suivi par élève

---

## 6. Ordre et dépendances

```
Lot 0 (faux signal)        ─── indépendant, à faire tout de suite
Lot 1 (règles)             ─── bloquant pour tout le reste
   └─ Lot 2 (service)
        └─ Lot 3 (écrans mobile)
             └─ Lot 4 (admin rebranché)   ← vérifiable seulement quand un élève a rendu
                  └─ Lot 5 (contrôle prof)
```

Le Lot 4 ne peut être **testé** qu'après le Lot 3 : il n'y a aucune donnée avant.

---

## 7. Risques

| Risque | Gravité | Traitement |
|---|---|---|
| Règle mal écrite → échec d'évaluation au lieu d'un refus | **haute** | `get(clé, défaut)` systématique ; tester avec une séance sans `prolongement` |
| Écritures mobiles silencieuses masquant un refus de règle | **haute** | déployer et vérifier le Lot 1 **avant** le Lot 2 ; log explicite en dev |
| `dateLimite` est une chaîne `YYYY-MM-DD`, tout le reste est en ms epoch | moyenne | convertir au seul point de comparaison, ne pas changer le format (données existantes) |
| Un élève rejoue le devoir plusieurs fois | moyenne | `finishedAt` posé une fois ; l'UI masque un devoir rendu ; `arrayUnion` reste additif par conception |
| Contrainte mono-classe (`classLinks` en merge) | faible | hors périmètre, déjà documentée |
| Google Cloud Storage bloqué (facturation) | **bloquante à part** | sans rapport avec ce plan, mais empêche de tester l'app |

---

## 8. Ce que le plan ne fait pas

- **Pas de notification push** de rappel d'échéance — `pushTokens` existe, mais c'est un autre chantier.
- **Pas de contenu propre au prolongement** : on rejoue les quiz de la séance.
- **Pas de note** : on mesure le rendu et la maîtrise par notion, pas une note sur 20.
- **Pas d'intégration aux cumuls annuels** (`masteryByCategory`) : les réponses du devoir resteraient séparées de celles de la séance. À trancher — l'intégrer fausserait la comparaison entre séances déjà comptées.

---

## 9. Estimation

| Lot | Charge |
|---|---|
| 0 — faux signal | 0,5 h |
| 1 — règles | 2 h (dont test) |
| 2 — service mobile | 3 h |
| 3 — écrans mobile | 8 h |
| 4 — admin rebranché | 3 h |
| 5 — contrôle prof | 4 h |
| **Total** | **~20 h**, soit 3 jours |

Hors Lot 5 (qui peut suivre) : **~16 h**.
