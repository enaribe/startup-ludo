import type { PartnerProgram, ProgramPartner } from '@/types/program';

export const MASTERCARD_PARTNER: ProgramPartner = {
  id: 'mastercard-foundation',
  slug: 'mastercard-foundation',
  name: 'Mastercard Foundation',
  shortName: 'Mastercard',
  description: 'Programmes partenaires pour accompagner les jeunes entrepreneurs africains.',
  logoUrl: null,
  bannerUrl: null,
  primaryColor: '#FFBC40',
  secondaryColor: '#EB001B',
  isActive: true,
};

export const MASTERCARD_PROGRAMS: PartnerProgram[] = [
  {
    id: 'young-africa-works',
    slug: 'young-africa-works',
    partnerId: MASTERCARD_PARTNER.id,
    name: 'Young Africa Works',
    subtitle: 'Parcours emploi et entrepreneuriat',
    description:
      "Un parcours de decouverte pour transformer une intention entrepreneuriale en projet concret, avec des cartes centrees sur marche, client, financement et execution.",
    heroImageUrl: null,
    bannerUrl: null,
    logoUrl: null,
    playerCount: 1232,
    sessionCount: 7,
    audience: {
      ageRange: '18-35 ans',
      locations: ['Dakar', 'Thies', 'Saint-Louis', 'Kaolack'],
      sector: 'Entrepreneuriat',
      profile: "Jeunes porteurs d'idee et entrepreneurs debutants",
    },
    tags: ['Ideation', 'Marche', 'Financement'],
    primaryColor: '#27A9E1',
    secondaryColor: '#FFBC40',
    sortOrder: 1,
    isActive: true,
    contentPacks: [
      {
        id: 'yaw-discovery',
        programId: 'young-africa-works',
        name: 'Decouverte entrepreneuriale',
        quizzes: [
          {
            id: 'yaw_quiz_1',
            question: 'Quel element valide le mieux le besoin client au demarrage ?',
            options: ['Un logo', 'Des entretiens clients', 'Une page Instagram', 'Un bureau'],
            correctAnswer: 1,
            category: 'marketing',
            difficulty: 'facile',
            explanation: 'Les entretiens clients permettent de verifier le probleme avant de construire la solution.',
          },
          {
            id: 'yaw_quiz_2',
            question: 'Pourquoi separer les depenses personnelles et celles du projet ?',
            options: ['Pour payer moins cher', 'Pour suivre la rentabilite', 'Pour eviter les clients', 'Pour recruter plus vite'],
            correctAnswer: 1,
            category: 'financement',
            difficulty: 'facile',
          },
        ],
        duels: [
          {
            id: 'yaw_duel_1',
            question: 'Un client dit que ton prix est trop eleve. Quelle reaction est la plus solide ?',
            category: 'vente',
            options: [
              { text: 'Comprendre la valeur attendue et ajuster l offre', points: 30 },
              { text: 'Faire une remise limitee', points: 20 },
              { text: 'Changer de client immediatement', points: 10 },
            ],
          },
        ],
        fundings: [
          {
            id: 'yaw_funding_1',
            title: 'Appui de demarrage',
            description: 'Un partenaire local finance vos premiers tests terrain.',
            tokens: 4,
            source: 'Partenaire',
          },
        ],
        opportunities: [
          {
            id: 'yaw_opp_1',
            title: 'Mentor disponible',
            description: 'Un mentor vous aide a clarifier votre proposition de valeur.',
            tokens: 2,
          },
        ],
        challengeEvents: [
          {
            id: 'yaw_chal_1',
            title: 'Hypothese fragile',
            description: 'Votre idee repose sur une hypothese client non verifiee.',
            tokens: -2,
          },
        ],
      },
    ],
  },
  {
    id: 'yeah',
    slug: 'yeah',
    partnerId: MASTERCARD_PARTNER.id,
    name: 'YEAH - Yaakaar Jeunesse & Entrepreneuriat',
    subtitle: 'Agribusiness et agriculture integree',
    description:
      "Un parcours de 7 parties pour transformer une idee en projet entrepreneurial dans le secteur agribusiness et agriculture integree.",
    heroImageUrl: null,
    bannerUrl: null,
    logoUrl: null,
    playerCount: 1232,
    sessionCount: 7,
    audience: {
      ageRange: '18-35 ans',
      locations: ['Dakar', 'Thies', 'Saint-Louis', 'Kaolack'],
      sector: 'Agribusiness',
      profile: "Porteurs d'idee et jeunes entrepreneurs",
    },
    tags: ['Agriculture', 'Business plan', 'Impact'],
    primaryColor: '#1F91D0',
    secondaryColor: '#FFBC40',
    sortOrder: 2,
    isActive: true,
    contentPacks: [
      {
        id: 'yeah-agri-start',
        programId: 'yeah',
        name: 'Premiers pas agribusiness',
        quizzes: [
          {
            id: 'yeah_program_quiz_1',
            question: 'Dans un projet agricole, quelle information faut-il verifier avant de produire en volume ?',
            options: ['La couleur du logo', 'La demande du marche', 'Le nom du terrain', 'Le nombre de concurrents lointains uniquement'],
            correctAnswer: 1,
            category: 'strategie',
            difficulty: 'facile',
          },
          {
            id: 'yeah_program_quiz_2',
            question: 'Quel indicateur aide a suivre la rentabilite d une activite de transformation agricole ?',
            options: ['Le cout de revient', 'La taille du sac', 'Le nombre de photos', 'La distance du bureau'],
            correctAnswer: 0,
            category: 'financement',
            difficulty: 'moyen',
          },
        ],
        duels: [
          {
            id: 'yeah_program_duel_1',
            question: 'Votre recolte arrive plus tard que prevu. Quelle decision protege le mieux vos clients ?',
            category: 'operations',
            options: [
              { text: 'Informer les clients et proposer un calendrier realiste', points: 30 },
              { text: 'Promettre la livraison sans certitude', points: 10 },
              { text: 'Chercher un fournisseur relais fiable', points: 20 },
            ],
          },
        ],
        fundings: [
          {
            id: 'yeah_program_funding_1',
            title: 'Subvention equipement',
            description: 'Votre dossier convainc un programme local d appui agricole.',
            tokens: 4,
            source: 'Subvention',
          },
        ],
        opportunities: [
          {
            id: 'yeah_program_opp_1',
            title: 'Contrat avec une cantine',
            description: 'Une cantine locale veut tester vos produits pendant deux semaines.',
            tokens: 2,
          },
        ],
        challengeEvents: [
          {
            id: 'yeah_program_chal_1',
            title: 'Perte post-recolte',
            description: 'Une mauvaise conservation reduit votre stock disponible.',
            tokens: -2,
          },
        ],
      },
    ],
  },
  {
    id: 'meliteji-wasu',
    slug: 'meliteji-wasu',
    partnerId: MASTERCARD_PARTNER.id,
    name: 'Meliteji Wasu',
    subtitle: 'Parcours rural et chaines de valeur',
    description:
      "Un programme pour tester un projet rural, structurer son offre et mieux negocier avec les acteurs de la chaine de valeur.",
    heroImageUrl: null,
    bannerUrl: null,
    logoUrl: null,
    playerCount: 842,
    sessionCount: 5,
    audience: {
      ageRange: '18-35 ans',
      locations: ['Louga', 'Matam', 'Tambacounda'],
      sector: 'Chaines de valeur rurales',
      profile: 'Jeunes entrepreneurs ruraux',
    },
    tags: ['Rural', 'Commercialisation', 'Operations'],
    primaryColor: '#4CAF50',
    secondaryColor: '#FFBC40',
    sortOrder: 3,
    isActive: true,
    contentPacks: [
      {
        id: 'meliteji-market',
        programId: 'meliteji-wasu',
        name: 'Acces marche',
        quizzes: [
          {
            id: 'meliteji_quiz_1',
            question: 'Que faut-il connaitre avant de negocier avec un grossiste ?',
            options: ['Son prix cible et vos couts', 'Son age', 'La couleur de son camion', 'Le nom de son quartier uniquement'],
            correctAnswer: 0,
            category: 'strategie',
            difficulty: 'facile',
          },
        ],
        duels: [
          {
            id: 'meliteji_duel_1',
            question: 'Un intermediaire propose un achat immediat mais a bas prix. Quelle option est la plus equilibree ?',
            category: 'negociation',
            options: [
              { text: 'Comparer avec vos couts et negocier un minimum rentable', points: 30 },
              { text: 'Accepter sans calcul', points: 10 },
              { text: 'Refuser toute discussion', points: 20 },
            ],
          },
        ],
        fundings: [
          {
            id: 'meliteji_funding_1',
            title: 'Financement stockage',
            description: 'Un appui permet de mieux stocker avant la vente.',
            tokens: 4,
            source: 'Microfinance',
          },
        ],
        opportunities: [
          {
            id: 'meliteji_opp_1',
            title: 'Commande groupee',
            description: 'Des producteurs voisins veulent mutualiser la distribution.',
            tokens: 2,
          },
        ],
        challengeEvents: [
          {
            id: 'meliteji_chal_1',
            title: 'Transport retarde',
            description: 'Un retard logistique menace votre marge.',
            tokens: -2,
          },
        ],
      },
    ],
  },
];

