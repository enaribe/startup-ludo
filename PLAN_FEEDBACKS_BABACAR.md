# Plan d'action — Feedbacks Babacar BIRANE

**Source** : Synthèse feedbacks Babacar BIRANE
**Total** : 23 feedbacks regroupés par priorité d'exécution
**Date du plan** : 2026-05-18

---

## ⚡ LOT 1 — À corriger AVANT le prochain test (bugs bloquants)

Ces 5 points cassent l'expérience. À traiter en premier.

| ID  | Problème                                                              | Action                                                                                                  | Statut       |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| F05 | Clic « Créer un compte » retourne à l'accueil                         | Corriger la redirection du CTA vers l'écran de création de compte                                       | ✅ Corrigé   |
| F07 | Paramètres affichent « connecté » alors qu'on est invité              | Fiabiliser l'état de session partout                                                                    | ✅ Corrigé   |
| F11 | Messages d'erreur salon flous                                         | Distinguer : salon plein / partie démarrée / partie terminée / code invalide / réseau                   | ✅ Corrigé   |
| F16 | Bug quand un joueur ne peut pas payer (manque jetons)                 | Tester tous les états sans jetons + écran clair + retour au tour suivant                                | ⬜ À faire   |
| F18 | Popup « manque de jetons » s'affiche au mauvais joueur                | Corriger le contexte d'acteur (jamais le joueur local par défaut)                                       | ⬜ À faire   |

---

## 🎯 LOT 2 — Décisions produit à arbitrer (rapide, gros impact)

| ID  | Question                                              | Décision recommandée                                                                |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| F04 | Faut-il un compte pour jouer en ligne ?               | **Autoriser invité** ; compte requis uniquement pour sauvegarde / classement       |
| F08 | Bloquer le jeu sans projet créé ?                     | **Non bloquer** → 3 voies : jouer vite / créer manuel / créer IA                   |
| F22 | Renommer XP → Petaw (PTW) ?                           | Arbitrer puis renommer partout                                                      |

---

## 🛠️ LOT 3 — Sprint UX Compte & Invitation

| ID  | Feedback                                                                 | Action                                                                                              |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| F01 | Notification quand on reçoit une invitation alors qu'on a déjà un compte | Notification in-app + écran d'invitation qui mène directement au salon (✅ Corrigé — invitation par contact suivi, popup temps réel ; push natif reporté en V1.5) |
| F02 | Code d'invitation devrait être un lien                                   | Deep link : le lien d'invitation ouvre l'app + valide le code + entre dans le salon (✅ Corrigé — scheme custom) |
| F06 | Pas d'endroit clair où créer son compte                                  | Entrées visibles « Créer un compte » : Accueil, mode invité, Paramètres, fin de partie (✅ Corrigé — bannière persistante sur l'accueil + paramètres + carte challenge + popup mode en ligne + écran résultats) |
| F19 | En mode invité, bouton « Se connecter » manquant                         | Bouton « Se connecter / Créer un compte » toujours visible en mode invité                           |

---

## 🎨 LOT 4 — Sprint Onboarding & Création d'entreprise

| ID  | Feedback                                                          | Action                                                                                  |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| F09 | Création manuelle d'entreprise sans IA                            | Voie manuelle (nom, secteur, description) à côté de l'IA (✅ Déjà en place — option "CRÉER MANUELLEMENT" dans creation-method) |
| F10 | Raisonnement derrière la valorisation initiale                    | Texte explicatif : facteurs utilisés, caractère estimatif, lien performance/apprentissage (✅ Corrigé — IA calcule la valorisation et fournit explication + facteurs détaillés ; fallback algo multiplicateurs si API indisponible) |
| F12 | Question « quel profil vous ressemble »                           | Préférence utilisateur non bloquante si elle influence le contenu                       |
| F13 | Choix de l'idée PP/SP/PN/SN à clarifier                           | Clarifier la taxonomie + cartes d'idées avec descriptions courtes et impacts            |

---

## 💅 LOT 5 — Polish UI & Wording

| ID  | Feedback                                                | Action                                                                                  |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| F03 | Effet trop intrusif du popup « Jeu en ligne »           | Réduire l'animation / l'effet visuel                                                    |
| F21 | Mot « startup » encore présent dans certains écrans     | Remplacer par entreprise / projet / activité (sauf nom de marque Startup Ludo)          |

---

## 📊 LOT 6 — Analytics (à câbler avant production)

**F23 — Instrumenter les événements clés.**

### Parcours
- Ouverture de l'app
- Création de compte
- Entrée invité
- Invitation envoyée / reçue
- Code validé
- Salon rejoint / refusé
- Lancement partie
- Abandon
- Fin de partie
- Erreurs / bugs

### Pédagogie
- Cartes affichées
- Cartes écoutées
- Réponses quiz
- Scores duel
- Niveaux joués
- Secteurs choisis
- Difficulté choisie

### KPI
- Taux de démarrage de partie
- Taux de fin de partie
- Abandon par écran
- Conversion invité → compte
- Fréquence des erreurs salon
- Compréhension des quiz

---

## 🚀 LOT 7 — Roadmap V1.5+ (plus tard)

| ID  | Feedback                                          | Action                                                              |
| --- | ------------------------------------------------- | ------------------------------------------------------------------- |
| F14 | Idée libre → IA crée le contenu                   | Parcours : idée libre → résumé IA → adaptation contenus/scénario   |
| F15 | Niveau de difficulté du contenu                   | Débutant / Standard / Avancé, ou adaptation auto selon profil      |
| F17 | Audios pour les textes                            | Audio FR + Wolof, bouton lecture sur chaque carte                  |
| F20 | Choisir le nombre de pions                        | Étudier impact équilibre, puis proposer choix simple               |

---

## ✅ Critères d'acceptation prioritaires

| Sujet                  | Critère d'acceptation                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Compte et mode invité  | Un joueur invité voit toujours un bouton « Se connecter / Créer un compte », mais peut rejoindre une partie sans blocage          |
| Création de compte     | Tout clic sur « Créer un compte » ouvre l'écran de création de compte, sans retour inattendu à l'accueil                          |
| Invitation             | Un lien d'invitation ouvre l'app, valide le code et affiche le salon ou un message d'erreur précis                                |
| Salon indisponible     | Si le salon est plein ou déjà démarré, le joueur reçoit un message explicite et une action alternative                            |
| Manque de jetons       | L'application ne bloque pas et n'affiche jamais le popup au mauvais joueur                                                        |
| Valorisation           | Le joueur peut ouvrir une explication simple de la valorisation initiale et de son évolution                                      |
| Terminologie           | Les écrans génériques utilisent entreprise / projet / activité ; Startup Ludo reste le nom de marque                              |
| Petaw                  | L'ancienne mention XP n'apparaît plus dans l'interface si Petaw (PTW) est retenu                                                  |

---

## 📅 Ordre d'exécution conseillé

1. **Cette semaine** → Lot 1 (bugs critiques) + Lot 2 (décisions produit)
2. **Sprint suivant** → Lot 3 (compte / invitation) + Lot 4 (onboarding)
3. **Avant release** → Lot 5 (polish) + Lot 6 (analytics)
4. **V1.5+** → Lot 7 (features avancées)

---

## 📌 Annexe — Tableau complet des 23 feedbacks

| ID  | Thème                       | Feedback reformulé                                                                                                       | Type                | Lot                       |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------- | ------------------------- |
| F01 | Compte & invitation         | Notification quand on reçoit une invitation alors qu'on a un compte                                                      | UX                  | Sprint UX invitation      |
| F02 | Compte & invitation         | Le code d'invitation devrait être un lien direct                                                                         | UX / Tech           | Sprint invitation         |
| F03 | Jeu en ligne                | Diminuer l'effet du popup « Jeu en ligne »                                                                               | UI                  | Polish UI                 |
| F04 | Compte & accès              | Obligation de compte pour jouer à distance ?                                                                             | Arbitrage           | Décision produit          |
| F05 | Compte & accès              | Clic « Créer un compte » retourne à l'accueil                                                                            | Bug                 | À corriger avant test     |
| F06 | Compte & accès              | Pas d'endroit clair où créer son compte                                                                                  | UX                  | À corriger avant test     |
| F07 | Session & paramètres        | Paramètres indiquent « connecté » alors que non cohérent                                                                 | Bug                 | À corriger avant test     |
| F08 | Onboarding                  | Obligation de créer un projet avant de démarrer                                                                          | UX / Produit        | Décision onboarding       |
| F09 | Création d'entreprise       | Création manuelle d'entreprise sans IA                                                                                   | Produit             | Sprint onboarding         |
| F10 | Progression & valorisation  | Raisonnement derrière la valorisation initiale                                                                           | UX / Contenu        | Sprint pédagogie          |
| F11 | Salon multijoueur           | Mauvais feedback quand le salon est plein ou la partie démarrée                                                          | Bug                 | À corriger avant test     |
| F12 | Profil utilisateur          | « Quel profil vous ressemble ? »                                                                                         | Produit             | Roadmap profil            |
| F13 | Choix de l'idée             | Indiquer PP / SP / PN / SN, sélection plus riche                                                                         | Produit / Contenu   | Roadmap idée              |
| F14 | Choix de l'idée             | Choisir sa propre idée + IA génère le contenu                                                                            | Produit IA          | Roadmap IA                |
| F15 | Contenu                     | Choisir un niveau de difficulté                                                                                          | Produit / Pédagogie | Roadmap pédagogie         |
| F16 | Jetons & états de jeu       | Bug après blocage par manque de jetons                                                                                   | Bug                 | À corriger avant test     |
| F17 | Accessibilité               | Audios pour les textes                                                                                                   | Accessibilité       | V1.5 audio                |
| F18 | Jetons & popups             | Popup « manque de jetons » affiché au mauvais joueur                                                                     | Bug                 | À corriger avant test     |
| F19 | Mode invité                 | Bouton « Se connecter » en mode invité                                                                                   | UX                  | Sprint compte             |
| F20 | Règles de jeu               | Choisir le nombre de pions                                                                                               | Gameplay            | Roadmap gameplay          |
| F21 | Terminologie                | Le mot « startup » traîne encore                                                                                         | UX writing          | Audit wording             |
| F22 | Terminologie                | Remplacer XP par Petaw (PTW)                                                                                             | Branding            | Décision branding         |
| F23 | Analytics                   | Prévoir des analytics du jeu                                                                                             | Data                | Plan analytics            |
