/**
 * 16 questions du quiz final certification (4 blocs de 4)
 * Seuil de réussite : 75% (12/16 minimum)
 */

export const QUIZ_PASS_THRESHOLD = 0.75; // 75% = 12/16 minimum

export interface QuizFinalQuestion {
  id: string;
  block: 1 | 2 | 3 | 4;
  blockName: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0-3
}

export const QUIZ_FINAL_QUESTIONS: QuizFinalQuestion[] = [
  // Bloc 1 - Découverte
  {
    id: 'q1_1',
    block: 1,
    blockName: 'Découverte',
    question: "Qu'est-ce qui valide une idée entrepreneuriale ?",
    options: [
      'Un sentiment personnel uniquement',
      'Une validation du marché et des besoins réels',
      'L\'avis d\'un seul client',
      'Le nombre de likes sur les réseaux',
    ],
    correctIndex: 1,
  },
  {
    id: 'q1_2',
    block: 1,
    blockName: 'Découverte',
    question: "À quoi sert une étude de marché ?",
    options: [
      'À copier les concurrents',
      'À comprendre la demande, les concurrents et les tendances',
      'À dépenser un budget marketing',
      'À éviter de parler aux clients',
    ],
    correctIndex: 1,
  },
  {
    id: 'q1_3',
    block: 1,
    blockName: 'Découverte',
    question: "Pourquoi choisir un secteur d'activité ?",
    options: [
      'Pour suivre une mode',
      'Pour concentrer ses compétences et connaître le terrain',
      'Pour éviter la concurrence',
      'Pour plaire à sa famille',
    ],
    correctIndex: 1,
  },
  {
    id: 'q1_4',
    block: 1,
    blockName: 'Découverte',
    question: "Qu'est-ce que l'exploration entrepreneuriale ?",
    options: [
      'Rester dans son bureau',
      'Sortir sur le terrain, observer et tester des hypothèses',
      'Lire uniquement des livres',
      'Attendre que les clients viennent',
    ],
    correctIndex: 1,
  },
  // Bloc 2 - Idéation
  {
    id: 'q2_1',
    block: 2,
    blockName: 'Idéation',
    question: "Qu'est-ce qu'une proposition de valeur ?",
    options: [
      'Le prix le plus bas du marché',
      'Ce que ton offre apporte de unique au client par rapport aux alternatives',
      'Une liste de fonctionnalités',
      'Le slogan publicitaire',
    ],
    correctIndex: 1,
  },
  {
    id: 'q2_2',
    block: 2,
    blockName: 'Idéation',
    question: "Un bon pitch doit :",
    options: [
      'Durer au moins 30 minutes',
      'Être clair, concis et convaincant en peu de temps',
      'Contenir le maximum de jargon',
      'Éviter de mentionner le problème',
    ],
    correctIndex: 1,
  },
  {
    id: 'q2_3',
    block: 2,
    blockName: 'Idéation',
    question: "Comment bien définir le problème ou le besoin ?",
    options: [
      'En imaginant ce que les clients veulent',
      'En écoutant les clients et en observant les comportements',
      'En copiant un concurrent',
      'En évitant les entretiens',
    ],
    correctIndex: 1,
  },
  {
    id: 'q2_4',
    block: 2,
    blockName: 'Idéation',
    question: "La cible et le marché désignent :",
    options: [
      'Tout le monde',
      'Les clients prioritaires et la taille du marché adressable',
      'Uniquement les investisseurs',
      'Les fournisseurs',
    ],
    correctIndex: 1,
  },
  // Bloc 3 - Démarrage
  {
    id: 'q3_1',
    block: 3,
    blockName: 'Démarrage',
    question: "Un modèle économique décrit :",
    options: [
      'Seulement les coûts',
      'Comment l\'entreprise crée, délivre et capture de la valeur (revenus, coûts)',
      'Uniquement le prix de vente',
      'Les dépenses marketing',
    ],
    correctIndex: 1,
  },
  {
    id: 'q3_2',
    block: 3,
    blockName: 'Démarrage',
    question: "À quoi sert un plan financier ?",
    options: [
      'À impressionner les banques uniquement',
      'À anticiper les flux de trésorerie, les revenus et les besoins de financement',
      'À éviter de parler d\'argent',
      'À fixer le salaire du dirigeant',
    ],
    correctIndex: 1,
  },
  {
    id: 'q3_3',
    block: 3,
    blockName: 'Démarrage',
    question: "La formalisation administrative comprend :",
    options: [
      'Rien de spécifique',
      'Statut juridique, fiscalité, assurances, contrats',
      'Uniquement le nom de l\'entreprise',
      'Les réseaux sociaux',
    ],
    correctIndex: 1,
  },
  {
    id: 'q3_4',
    block: 3,
    blockName: 'Démarrage',
    question: "Le seuil de rentabilité est :",
    options: [
      'Le premier euro gagné',
      'Le niveau d\'activité à partir duquel les revenus couvrent les coûts',
      'Le chiffre d\'affaires maximum',
      'Le nombre de clients',
    ],
    correctIndex: 1,
  },
  // Bloc 4 - Réussite
  {
    id: 'q4_1',
    block: 4,
    blockName: 'Réussite',
    question: "Une stratégie de croissance peut s'appuyer sur :",
    options: [
      'Le hasard uniquement',
      'L\'expansion géographique, de nouveaux produits ou de nouveaux segments',
      'La réduction des coûts seulement',
      'L\'arrêt des investissements',
    ],
    correctIndex: 1,
  },
  {
    id: 'q4_2',
    block: 4,
    blockName: 'Réussite',
    question: "L'impact social ou environnemental :",
    options: [
      'N\'intéresse pas les entrepreneurs',
      'Peut être mesuré et communiqué pour renforcer la valeur et l\'engagement',
      'Est réservé aux grandes entreprises',
      'Ne se planifie pas',
    ],
    correctIndex: 1,
  },
  {
    id: 'q4_3',
    block: 4,
    blockName: 'Réussite',
    question: "L'innovation dans une startup peut être :",
    options: [
      'Uniquement technologique',
      'Produit, process, modèle économique ou organisationnelle',
      'Interdite en phase de démarrage',
      'Réservée aux laboratoires',
    ],
    correctIndex: 1,
  },
  {
    id: 'q4_4',
    block: 4,
    blockName: 'Réussite',
    question: "Le leadership entrepreneurial implique :",
    options: [
      'Tout décider seul',
      'Vision, délégation, motivation et prise de décision en équipe',
      'Éviter les conflits',
      'Ne jamais changer d\'avis',
    ],
    correctIndex: 1,
  },
];
