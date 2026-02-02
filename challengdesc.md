SYSTÈME DE CHALLENGES DANS STARTUP LUDO MOBILE
VISION GÉNÉRALE
Problématique actuelle
L'application Startup Ludo est actuellement conçue exclusivement pour le programme YEAH. Toute la logique de jeu (niveaux, secteurs, cartes, progression) est codée en dur pour ce programme spécifique.
Conséquence : Pour ajouter un nouveau programme (DER, FORCE-N, WEECAP, etc.), il faudrait dupliquer tout le code, ce qui est :

Non maintenable
Source d'erreurs
Coûteux en développement

Solution proposée : Le système de Challenges
Un Challenge est une abstraction qui représente n'importe quel programme d'accompagnement entrepreneurial.
Principe fondamental :

Le code du jeu devient universel et piloté par des données. Ajouter un nouveau programme = ajouter uniquement des données de configuration, sans toucher au code.


CONCEPTS CLÉS
1. Qu'est-ce qu'un Challenge ?
Un Challenge est une instance de programme caractérisée par :
Identité

Un nom unique (ex: "YEAH", "DER-FJ", "FORCE-N")
Une organisation porteuse (ex: "Mastercard Foundation")
Un visuel distinctif (logo, bannière, couleurs)

Structure de progression

Un nombre de niveaux (généralement 4)
Des sous-niveaux par niveau (généralement 4 par niveau)
Des seuils d'XP spécifiques à chaque étape

Contenus pédagogiques

Des secteurs d'activité propres au programme
Des cartes éducatives (Opportunité, Challenge, Quiz, Duel, Financement)
Des livrables spécifiques (pitch, business plan, certificat)

Règles de jeu

Progression séquentielle ou libre
Activation/désactivation de la capture
Mécaniques de déblocage personnalisées

2. Relation entre Joueur et Challenges
Un joueur peut :

S'inscrire à plusieurs Challenges simultanément
Avoir une progression indépendante dans chaque Challenge
Basculer entre ses Challenges actifs
Compléter plusieurs programmes en parallèle

Exemple concret :
Joueur : Amadou
├── Challenge YEAH
│   ├── Niveau 2/4
│   ├── 8 500 XP
│   └── Secteur choisi : Élevage
│
├── Challenge DER-FJ
│   ├── Niveau 1/4
│   ├── 2 000 XP
│   └── Secteur : Non encore choisi
│
└── Challenge FORCE-N
    ├── Niveau 3/4
    ├── 25 000 XP
    └── Secteur choisi : Maraîchage
Amadou peut jouer au Challenge YEAH le matin, puis basculer sur DER-FJ l'après-midi. Chaque progression est sauvegardée indépendamment.

ARCHITECTURE DU SYSTÈME
Vue d'ensemble
┌─────────────────────────────────────────────────────────┐
│                    BASE DE DONNÉES                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  CHALLENGES (Programmes disponibles)                     │
│  ├── YEAH                                                │
│  ├── DER-FJ                                              │
│  ├── FORCE-N                                             │
│  └── WEECAP                                              │
│                                                           │
│  INSCRIPTIONS (ChallengeEnrollment)                      │
│  ├── Amadou → YEAH (Progression)                        │
│  ├── Amadou → DER-FJ (Progression)                      │
│  ├── Fatou → YEAH (Progression)                         │
│  └── Ibrahima → FORCE-N (Progression)                   │
│                                                           │
│  CONTENUS (Cartes, Secteurs)                            │
│  └── Organisés par Challenge                            │
│                                                           │
└─────────────────────────────────────────────────────────┘
Composants principaux
1. Challenge (Le programme lui-même)
Informations générales

Identifiant unique
Nom affiché
Description
Organisation propriétaire
Dates de début/fin
Statut (actif/inactif)
Visuels (logo, bannière)

Configuration de progression

Nombre total de niveaux
XP total requis pour compléter le Challenge
Liste des niveaux avec leurs configurations

Contenus disponibles

Liste des secteurs disponibles
Référence vers les cartes pédagogiques
Templates de livrables

Récompenses

Badges à différents paliers
Statuts spéciaux (Champion Local, Régional, National)
Certificats

2. Niveau (ChallengeLevel)
Définition
Chaque niveau représente une étape majeure du parcours entrepreneurial.
Exemple pour YEAH :

Niveau 1 : Découverte
Niveau 2 : Idéation
Niveau 3 : Démarrage
Niveau 4 : Réussite

Caractéristiques d'un niveau

Numéro du niveau (1, 2, 3, 4)
Nom et description
XP total requis pour compléter ce niveau
Liste des sous-niveaux
Type de livrable produit à la fin
Posture du joueur à ce stade (ex: "Curieux", "Porteur de projet")

3. Sous-niveau (ChallengeSubLevel)
Définition
Subdivision d'un niveau représentant une compétence ou étape spécifique.
Exemple Niveau 1 YEAH :

Sous-niveau 1.1 : Production végétale
Sous-niveau 1.2 : Élevage
Sous-niveau 1.3 : Transformation
Sous-niveau 1.4 : Services agricoles

Exemple Niveau 2 YEAH :

Sous-niveau 2.1 : Problème / Besoin
Sous-niveau 2.2 : Solution
Sous-niveau 2.3 : Cible et Marché
Sous-niveau 2.4 : Faisabilité et Impact

Caractéristiques d'un sous-niveau

Numéro du sous-niveau (1, 2, 3, 4)
Nom et description
XP requis pour validation
Ensemble de cartes associées
Règles spécifiques (capture activée/désactivée, progression séquentielle)

4. Secteur (ChallengeSector)
Définition
Un secteur représente un domaine d'activité dans lequel le joueur peut se spécialiser.
Caractéristiques

Nom du secteur (ex: "Production végétale", "Élevage")
Description détaillée
Icône représentative
Catégorie (agriculture, technologie, services, etc.)
Les 4 "maisons" du plateau pour ce secteur
Contenus spécifiques au secteur

Particularité :

Au Niveau 1, tous les secteurs sont explorés obligatoirement
À la fin du Niveau 1, le joueur en choisit un seul
Les Niveaux 2, 3, 4 se déroulent exclusivement dans ce secteur

5. Inscription (ChallengeEnrollment)
Définition
Représente la participation d'un joueur à un Challenge spécifique.
Informations de progression

Niveau actuel (1 à 4)
Sous-niveau actuel (1 à 4)
XP total accumulé
XP détaillé par niveau
Date d'inscription
Statut (actif, complété, abandonné)

Choix stratégiques

Secteur sélectionné (après Niveau 1)
Projet structuré (après Niveau 2)
Configuration de l'entreprise (Niveau 3)

Livrables générés

Pitch assisté (fin Niveau 2)
Business Plan simplifié (fin Niveau 3)
Business Plan enrichi (fin Niveau 4)
Statut Champion (si applicable)

6. Carte (Card)
Définition
Élément pédagogique unitaire utilisé pour faire progresser le joueur.
Types de cartes

OPPORTUNITÉ : Inspire, donne des exemples, ouvre des perspectives
CHALLENGE : Pose des difficultés réalistes, teste la résilience
QUIZ : Teste les connaissances, récompense l'apprentissage
DUEL : Défi contre d'autres joueurs ou IA
FINANCEMENT : Informe sur les ressources et programmes disponibles

Affiliation

Appartient à un Challenge spécifique
Associée à un niveau précis
Associée à un sous-niveau précis
Peut être liée à un secteur (ou générique)

Contenu

Titre
Texte principal
Média (image, vidéo)
Questions et options (pour Quiz/Duel)
Récompense en XP


FONCTIONNEMENT DÉTAILLÉ
1. Découverte et inscription aux Challenges
Processus :

Écran d'accueil des Challenges

Le joueur voit la liste des Challenges disponibles
Chaque Challenge affiche : nom, organisation, description, visuel
Indication : "Ouvert aux inscriptions" ou "Fermé"


Consultation d'un Challenge

Le joueur peut voir les détails avant de s'inscrire
Aperçu de la structure (4 niveaux, nombre de sous-niveaux)
Livrables attendus
Durée estimée


Inscription

Le joueur clique sur "Rejoindre ce programme"
Création d'un ChallengeEnrollment
Initialisation : Niveau 1, Sous-niveau 1, 0 XP
Le Challenge devient accessible



2. Sélection du Challenge actif
Concept :
À tout moment, un joueur a un Challenge actif (celui sur lequel il joue actuellement).
Processus de basculement :

Le joueur accède à "Mes Programmes"
Il voit ses inscriptions actives avec leur progression
Il sélectionne le Challenge sur lequel il veut jouer
L'application recharge le plateau avec :

Les secteurs du Challenge sélectionné
Les cartes correspondantes
La progression sauvegardée
Les règles spécifiques



Interface :
╔═══════════════════════════════════════╗
║  MES PROGRAMMES                       ║
╠═══════════════════════════════════════╣
║                                       ║
║  ┌─────────────────────┐             ║
║  │ YEAH                │   [ACTIF]   ║
║  │ Niveau 2/4          │             ║
║  │ ████████░░░░ 8500XP │             ║
║  │ Secteur: Élevage    │             ║
║  └─────────────────────┘             ║
║                                       ║
║  ┌─────────────────────┐             ║
║  │ DER-FJ              │  [Jouer]    ║
║  │ Niveau 1/4          │             ║
║  │ ███░░░░░░░░░ 2000XP │             ║
║  │ Secteur: Non choisi │             ║
║  └─────────────────────┘             ║
║                                       ║
║  + Rejoindre un nouveau programme    ║
║                                       ║
╚═══════════════════════════════════════╝
3. Progression dans un Challenge
Mécanisme d'accumulation d'XP :

Sources d'XP

Répondre correctement à un Quiz
Compléter une Opportunité
Surmonter un Challenge
Gagner un Duel
Découvrir une ressource de Financement


Enregistrement de l'XP

L'XP gagnée est ajoutée au ChallengeEnrollment
Mise à jour du total XP
Mise à jour de l'XP du niveau actuel
Mise à jour de l'XP du sous-niveau actuel


Vérification des débloquages
Débloquage de sous-niveau :

Si XP du sous-niveau actuel ≥ XP requis
ET si le sous-niveau suivant existe
→ Débloquer le sous-niveau suivant
→ Message de félicitations
→ Animation de progression

Débloquage de niveau :

Si tous les sous-niveaux du niveau sont validés
ET si XP du niveau ≥ XP requis
→ Déclencher la phase de clôture du niveau
→ Générer le livrable correspondant



4. Système de livrables
Principe :
À la fin de chaque niveau, le joueur produit un livrable concret qui structure son parcours.
Livrable Niveau 1 : Choix du secteur
Quand ?
Dès que le joueur a exploré les 4 secteurs (4 sous-niveaux validés, 6000 XP atteints)
Comment ?

Écran de synthèse montrant les 4 secteurs explorés
Statistiques de performance par secteur (facultatif)
Le joueur sélectionne un seul secteur
Confirmation du choix
Sauvegarde dans ChallengeEnrollment.selectedSector
Verrouillage du choix
Déblocage du Niveau 2

Résultat :
Le joueur entre au Niveau 2 avec un secteur défini, qui conditionne tous les contenus futurs.
Livrable Niveau 2 : Pitch assisté
Quand ?
Après validation des 4 sous-niveaux du Niveau 2 (10 000 XP)
Comment ?

Interface de pitch assisté (mini-formulaire)
Questions successives :

Quel problème résolvez-vous ?
Quelle est votre solution ?
Qui sont vos clients ?
Comment votre projet est-il viable ?
Quel impact visez-vous ?


Réponses courtes du joueur
Génération automatique d'un document de pitch structuré
Sauvegarde dans ChallengeEnrollment.deliverables.pitch
Déblocage du Niveau 3

Résultat :
Le joueur dispose d'un pitch clair et structuré de son idée.
Livrable Niveau 3 : Business Plan simplifié
Quand ?
Après validation des 4 sous-niveaux du Niveau 3 (20 000 XP)
Comment ?

Écran de synthèse du parcours :

Secteur choisi (Niveau 1)
Idée formalisée (Niveau 2)
Capacités opérationnelles (Niveau 3)


Questions de confirmation rapides
Génération automatique du Business Plan à partir de :

Toutes les données collectées depuis le Niveau 1
Réponses du pitch (Niveau 2)
Décisions prises au Niveau 3


Document structuré sauvegardé
Possibilité de télécharger/partager
Déblocage du Niveau 4

Résultat :
Le joueur a un Business Plan exploitable pour candidater à des programmes réels.
Livrable Niveau 4 : Business Plan enrichi + Statut Champion
Quand ?
Après validation des 4 sous-niveaux (40 000 XP) ET réussite au Quiz Global
Quiz Global :

4 blocs de questions (un par niveau)
Teste la cohérence et la maîtrise globale
Seuil minimum de réussite requis
En cas d'échec : possibilité de repasser

En cas de réussite :

Enrichissement automatique du Business Plan
Attribution d'un statut Champion (Local/Régional/National selon l'impact)
Badge Champion sur le profil
Accès à la communauté des Champions
Éligibilité pour accompagnement réel YEAH

Résultat :
Le joueur est officiellement reconnu comme entrepreneur accompli du programme.
5. Règles spécifiques par Challenge
Chaque Challenge peut avoir ses propres règles :
Progression séquentielle

Activée : Le joueur doit compléter chaque sous-niveau dans l'ordre
Désactivée : Le joueur peut naviguer librement entre sous-niveaux

Capture de propriétés

Activée : Le joueur peut acheter des propriétés sur le plateau (mécanique Monopoly)
Désactivée : Pas de système de propriété

Seuils d'XP personnalisés

Chaque Challenge définit ses propres seuils
Exemple : YEAH (1500/2500/5000/10000), DER (2000/3000/7000/15000)

Types de secteurs

Certains Challenges peuvent avoir des secteurs différents
Exemple : FORCE-N pourrait se concentrer uniquement sur le maraîchage


SCÉNARIOS D'USAGE
Scénario 1 : Joueur mono-Challenge
Amadou s'inscrit uniquement au Challenge YEAH

Inscription au Challenge YEAH
Joue au Niveau 1, explore les 4 secteurs (6000 XP)
Choisit le secteur "Élevage"
Progresse au Niveau 2, structure son idée (10 000 XP)
Génère son pitch
Continue jusqu'à la fin

Avantage :
Expérience concentrée et approfondie sur un seul programme.
Scénario 2 : Joueur multi-Challenge
Fatou s'inscrit à YEAH et DER-FJ simultanément
Lundi matin :

Active le Challenge YEAH
Joue au Niveau 1, Sous-niveau 1 (Production végétale)
Gagne 500 XP

Lundi après-midi :

Bascule sur le Challenge DER-FJ
Joue au Niveau 1, Sous-niveau 1 (ce sont d'autres secteurs, d'autres cartes)
Gagne 300 XP

Mardi :

Retour sur YEAH
Reprend exactement où elle était (Niveau 1, Sous-niveau 1, 500 XP)
Continue sa progression

Avantage :
Diversification de l'apprentissage, comparaison entre programmes.
Scénario 3 : Programme fermé temporairement
Le Challenge WEECAP est désactivé (isActive: false)

Les joueurs déjà inscrits peuvent continuer leur progression
Les nouveaux joueurs ne peuvent pas s'inscrire
Le Challenge n'apparaît pas dans la liste des programmes disponibles
Quand le Challenge est réactivé, les inscriptions rouvrent

Avantage :
Contrôle des cohortes et gestion des campagnes de recrutement.
Scénario 4 : Ajout d'un nouveau Challenge
L'équipe veut lancer le programme "AGRO-TECH"
Étapes :

Créer la configuration du Challenge AGRO-TECH
Définir les 4 niveaux et leurs sous-niveaux
Définir les secteurs (ex: AgriTech, FoodTech, Logistique digitale)
Créer les cartes pédagogiques (Opportunité, Challenge, Quiz, Duel, Financement)
Configurer les livrables spécifiques
Activer le Challenge

Résultat :
Le Challenge AGRO-TECH apparaît immédiatement dans l'app, sans modification du code source.

GESTION DES DONNÉES
Structure de stockage
Base de données locale (offline-first) :

Challenges disponibles (téléchargés et mis en cache)
ChallengeEnrollments de l'utilisateur
Cartes du Challenge actif (pré-chargées)
Livrables générés

Base de données serveur :

Catalogue complet des Challenges
Toutes les cartes de tous les Challenges
Progressions de tous les joueurs
Statistiques et analytics

Synchronisation
Au démarrage de l'app :

Télécharger la liste des Challenges actifs
Télécharger les ChallengeEnrollments de l'utilisateur
Charger les cartes du Challenge sélectionné

Pendant le jeu (hors ligne) :

Toutes les actions sont enregistrées localement
XP, déblocages, livrables sauvegardés en local

À la reconnexion :

Synchroniser la progression avec le serveur
Résoudre les conflits (last-write-wins ou autre stratégie)
Télécharger les nouveaux Challenges disponibles

Optimisations
Chargement paresseux (lazy loading) :

Ne charger que les cartes du sous-niveau actuel
Pré-charger le sous-niveau suivant en arrière-plan

Cache intelligent :

Garder en cache les Challenges actifs du joueur
Nettoyer périodiquement les Challenges non utilisés

Compression :

Compresser les visuels (logo, bannières)
Optimiser le poids des contenus textuels


INTERFACE ADMINISTRATEUR
Création d'un nouveau Challenge
Écran de configuration :
Étape 1 : Informations générales

Nom du Challenge
Organisation
Description
Dates de début/fin
Upload logo et bannière

Étape 2 : Structure de progression

Nombre de niveaux
Pour chaque niveau :

Nom et description
XP requis
Type de livrable
Nombre de sous-niveaux
Pour chaque sous-niveau :

Nom et description
XP requis
Règles (séquentiel, capture)





Étape 3 : Secteurs

Définir les secteurs disponibles
Nommer les 4 "maisons" pour chaque secteur
Upload icônes

Étape 4 : Contenus

Créer/importer les cartes
Affecter les cartes aux sous-niveaux
Définir les récompenses XP

Étape 5 : Validation et publication

Prévisualisation du Challenge
Test de cohérence (XP, structure)
Activation/désactivation

Gestion des Challenges existants
Tableau de bord :

Liste de tous les Challenges
Statistiques par Challenge :

Nombre d'inscrits
Taux de complétion
XP moyen
Temps moyen de complétion


Actions : Éditer, Dupliquer, Activer/Désactiver

Édition :

Modifier les contenus sans casser les progressions en cours
Versionning des Challenges (v1, v2, etc.)
Migration des joueurs entre versions si nécessaire


AVANTAGES DU SYSTÈME
1. Réutilisabilité totale du code
Avant :

Code YEAH = 10 000 lignes
Code DER = 10 000 lignes (duplication)
Code FORCE-N = 10 000 lignes (duplication)
Total : 30 000 lignes

Après :

Moteur de jeu universel = 10 000 lignes
Configuration YEAH = 500 lignes (données)
Configuration DER = 500 lignes (données)
Configuration FORCE-N = 500 lignes (données)
Total : 11 500 lignes

Gain : 60% de code en moins
2. Maintenance simplifiée
Avant :
Un bug dans la progression → Corriger dans 3 codebases différentes
Après :
Un bug dans la progression → Une seule correction, bénéficie à tous les Challenges
3. Évolutivité
Ajout d'un nouveau Challenge :

Avant : 2-3 semaines de développement
Après : 1-2 jours de configuration de données

4. Personnalisation
Chaque Challenge peut avoir :

Sa propre identité visuelle
Ses propres secteurs
Ses propres règles de jeu
Ses propres livrables

Tout en partageant le même moteur.
5. Expérience utilisateur enrichie
Les joueurs peuvent :

Comparer différents programmes
Suivre plusieurs parcours entrepreneuriaux
Diversifier leurs compétences
Choisir le programme le plus adapté à leurs objectifs

6. Analytics et pilotage
Vue consolidée :

Quel Challenge est le plus populaire ?
Quel Challenge a le meilleur taux de complétion ?
Quels secteurs attirent le plus de joueurs ?
Où les joueurs abandonnent-ils ?

Optimisation continue basée sur les données.

POINTS D'ATTENTION
1. Migration depuis l'existant
Si l'app existe déjà avec YEAH codé en dur :

Créer le système de Challenges
Migrer les données YEAH existantes vers le nouveau format
Transformer les progressions actuelles en ChallengeEnrollments
Tester la compatibilité
Déployer progressivement

Stratégie de migration :

Phase 1 : Déployer le système en parallèle (double écriture)
Phase 2 : Basculer progressivement les joueurs
Phase 3 : Désactiver l'ancien système

2. Gestion des versions de Challenges
Problème :
Si on modifie la structure d'un Challenge (ex: passer de 4 à 5 niveaux), que devient la progression des joueurs déjà inscrits ?
Solution :

Versionning des Challenges (YEAH v1, YEAH v2)
Les joueurs en cours restent sur v1
Les nouveaux inscrits vont sur v2
Migration optionnelle proposée aux joueurs v1

3. Performance et volumétrie
Considérations :

Un joueur avec 5 Challenges actifs = 5× plus de données
Charger intelligemment (uniquement le Challenge actif)
Limiter le nombre d'inscriptions simultanées si nécessaire

4. Cohérence des contenus
Risque :
Créer des Challenges avec des contenus incohérents ou incomplets
Solution :

Validation automatique lors de la création
Template de Challenge pré-rempli
Checklist de contrôle qualité

5. Offline-first
Défi :
Supporter plusieurs Challenges en mode hors ligne
Approche :

Télécharger uniquement les Challenges actifs de l'utilisateur
Synchronisation intelligente à la reconnexion
Gestion des conflits (exemple : joueur progresse hors ligne sur 2 appareils)


EXEMPLE CONCRET : CRÉATION DU CHALLENGE "DER-FJ"
Configuration
Identité :

ID : "der-fj"
Nom : "DER Jeunes"
Organisation : "Délégation à l'Entrepreneuriat Rapide"
Description : "Programme d'accompagnement pour jeunes entrepreneurs sénégalais"

Structure :

4 niveaux, 16 sous-niveaux au total
XP requis : 2000 / 3000 / 7000 / 15000 par sous-niveau

Secteurs :

Agriculture et pêche
Artisanat
Commerce et services
Technologie

Spécificités :

Capture activée dès le Niveau 1
Progression partiellement libre (on peut sauter des sous-niveaux)
Livrable Niveau 3 : Dossier de demande de financement DER (pas Business Plan)

Contenus
Niveau 1 - Exploration :

60 cartes QUIZ (15 par secteur)
40 cartes OPPORTUNITÉ (10 par secteur)
24 cartes FINANCEMENT (focus sur DER, 3F, fonds locaux)

Niveau 2 - Idéation :

Cartes axées sur l'innovation sociale
Quiz sur l'économie circulaire
Opportunités de partenariats avec structures d'accompagnement

Niveau 3 - Formalisation :

Cartes sur les démarches administratives sénégalaises (NINEA, registre commerce)
Quiz sur la fiscalité
Challenges liés aux premiers recrutements

Niveau 4 - Croissance :

Focus sur le passage à l'échelle
Cartes sur l'export et les marchés sous-régionaux
Opportunités de réseaux (CEDEAO, etc.)

Résultat
Le Challenge DER-FJ devient immédiatement disponible dans l'app. Les joueurs peuvent s'y inscrire et vivre une expérience complète, distincte de YEAH, sans qu'une seule ligne de code n'ait été modifiée dans le moteur de jeu.

ÉVOLUTIONS FUTURES POSSIBLES
1. Challenges collaboratifs
Concept :
Plusieurs joueurs s'inscrivent ensemble à un Challenge et progressent en équipe.
Mécaniques :

XP partagée
Livrables co-construits
Défis d'équipe

2. Challenges saisonniers
Concept :
Challenges temporaires avec durée limitée (ex: "Défi Agro 30 jours")
Mécaniques :

Date de fin stricte
Classement global
Récompenses spéciales

3. Challenges certifiants
Concept :
Compléter certains Challenges délivre une certification officielle reconnue.
Mécaniques :

Partenariats avec universités/ministères
Quiz de certification finale
Émission de diplômes numériques (blockchain)

4. Challenges premium
Concept :
Certains Challenges sont payants ou réservés à certains profils.
Mécaniques :

Accès conditionné (paiement, parrainage, sélection)
Contenus exclusifs
Accompagnement renforcé

5. Marketplace de Challenges
Concept :
Des organisations externes peuvent créer et proposer leurs propres Challenges.
Mécaniques :

Interface de création en self-service
Modération et validation par Startup Ludo
Commission sur les inscriptions


CONCLUSION
Le système de Challenges transforme Startup Ludo d'une application mono-programme à une plateforme multi-programmes scalable et pérenne.
Résumé en 3 points

Un seul code, plusieurs programmes

Le moteur de jeu est universel
Les programmes sont des configurations de données
Zéro duplication de code


Progression indépendante

Chaque joueur peut suivre plusieurs Challenges
Les progressions ne se mélangent pas
Livrables distincts par Challenge


Évolutivité maximale

Ajouter un programme = ajouter des données
Pas de limite au nombre de Challenges
Personnalisation totale par programme



Gain stratégique
Avant :
Startup Ludo = l'app du programme YEAH
Après :
Startup Ludo = la plateforme de référence pour tous les programmes d'accompagnement entrepreneurial en Afrique
Impact :

Multiplication des partenariats possibles
Diversification des sources de financement
Massification de l'impact
Positionnement comme infrastructure éducative


Le système de Challenges fait passer Startup Ludo du statut d'application à celui d'écosystème.