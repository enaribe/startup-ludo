/**
 * Script pour pousser le challenge YEAH sur Firestore via l'API admin
 *
 * 1. D'abord, lance l'admin: cd startup-ludo-admin && npm run dev
 * 2. Ensuite lance ce script: node scripts/seed-yeah.mjs
 */

const ADMIN_URL = 'http://localhost:3000/api/seed';

const YEAH_PROGRAM = {
  id: 'yeah',
  name: 'YEAH',
  description:
    "Programme d'accompagnement pour jeunes entrepreneurs agricoles. Développez vos compétences entrepreneuriales à travers 4 niveaux de progression et obtenez votre certification Champion.",
  organization: 'Mastercard Foundation',
  primaryColor: '#FFBC40',
  secondaryColor: '#EB001B',
  enabled: true,
  version: 'v1',
  rules: {
    sequentialProgression: true,
    captureEnabled: true,
    maxEnrollmentsPerUser: 5,
    allowLevelSkip: false,
  },
  levels: [
    {
      id: 'yeah_level_1',
      title: 'Découverte',
      description:
        'Explorez les 4 secteurs agricoles et découvrez votre passion entrepreneuriale.',
      order: 1,
      xpRequired: 6000,
      deliverableType: 'sector_choice',
      posture: 'Curieux',
      iconName: 'compass-outline',
      subLevels: [
        {
          id: 'yeah_level_1_sub_1',
          title: 'Production végétale',
          description: 'Découvrez le monde des cultures et du maraîchage.',
          order: 1,
          xpRequired: 1500,
          xpReward: 1500,
          deliverables: [],
          cardCategories: ['quiz', 'opportunity', 'funding'],
          rules: { captureEnabled: false, sequentialRequired: true },
        },
        {
          id: 'yeah_level_1_sub_2',
          title: 'Élevage',
          description: "Explorez les opportunités de l'élevage moderne.",
          order: 2,
          xpRequired: 3000,
          xpReward: 1500,
          deliverables: [],
          cardCategories: ['quiz', 'opportunity', 'funding'],
          rules: { captureEnabled: false, sequentialRequired: true },
        },
        {
          id: 'yeah_level_1_sub_3',
          title: 'Transformation',
          description: 'Apprenez à créer de la valeur ajoutée.',
          order: 3,
          xpRequired: 4500,
          xpReward: 1500,
          deliverables: [],
          cardCategories: ['quiz', 'opportunity', 'funding'],
          rules: { captureEnabled: false, sequentialRequired: true },
        },
        {
          id: 'yeah_level_1_sub_4',
          title: 'Services agricoles',
          description: "Découvrez l'écosystème de services.",
          order: 4,
          xpRequired: 6000,
          xpReward: 1500,
          deliverables: [],
          cardCategories: ['quiz', 'opportunity', 'funding'],
          rules: { captureEnabled: false, sequentialRequired: true },
        },
      ],
    },
    {
      id: 'yeah_level_2',
      title: 'Idéation',
      description:
        "Structurez votre idée d'entreprise et définissez votre proposition de valeur.",
      order: 2,
      xpRequired: 10000,
      deliverableType: 'pitch',
      posture: 'Porteur de projet',
      iconName: 'bulb-outline',
      subLevels: [
        {
          id: 'yeah_level_2_sub_1',
          title: 'Problème / Besoin',
          description: 'Identifiez un problème réel à résoudre.',
          order: 1,
          xpRequired: 2500,
          xpReward: 2500,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'opportunity'],
          rules: { captureEnabled: true, sequentialRequired: true },
        },
        {
          id: 'yeah_level_2_sub_2',
          title: 'Solution',
          description: 'Définissez votre solution unique.',
          order: 2,
          xpRequired: 5000,
          xpReward: 2500,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'opportunity'],
          rules: { captureEnabled: true, sequentialRequired: true },
        },
        {
          id: 'yeah_level_2_sub_3',
          title: 'Cible et Marché',
          description: 'Identifiez vos clients et votre marché.',
          order: 3,
          xpRequired: 7500,
          xpReward: 2500,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'duel'],
          rules: { captureEnabled: true, sequentialRequired: true },
        },
        {
          id: 'yeah_level_2_sub_4',
          title: 'Faisabilité et Impact',
          description: 'Validez la viabilité de votre projet.',
          order: 4,
          xpRequired: 10000,
          xpReward: 2500,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'duel'],
          rules: { captureEnabled: true, sequentialRequired: true },
        },
      ],
    },
    {
      id: 'yeah_level_3',
      title: 'Démarrage',
      description:
        "Lancez votre activité et construisez les bases de votre entreprise.",
      order: 3,
      xpRequired: 20000,
      deliverableType: 'business_plan_simple',
      posture: 'Entrepreneur',
      iconName: 'rocket-outline',
      subLevels: [
        {
          id: 'yeah_level_3_sub_1',
          title: 'Modèle économique',
          description: "Définissez comment vous allez gagner de l'argent.",
          order: 1,
          xpRequired: 5000,
          xpReward: 5000,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'funding'],
          rules: { captureEnabled: true, sequentialRequired: true },
        },
        {
          id: 'yeah_level_3_sub_2',
          title: 'Organisation',
          description: 'Structurez votre équipe et vos opérations.',
          order: 2,
          xpRequired: 10000,
          xpReward: 5000,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'opportunity'],
          rules: { captureEnabled: true, sequentialRequired: true },
        },
        {
          id: 'yeah_level_3_sub_3',
          title: 'Finances',
          description: 'Maîtrisez vos chiffres et votre trésorerie.',
          order: 3,
          xpRequired: 15000,
          xpReward: 5000,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'funding'],
          rules: { captureEnabled: true, sequentialRequired: true },
        },
        {
          id: 'yeah_level_3_sub_4',
          title: 'Formalisation',
          description: 'Officialisez votre entreprise.',
          order: 4,
          xpRequired: 20000,
          xpReward: 5000,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'duel'],
          rules: { captureEnabled: true, sequentialRequired: true },
        },
      ],
    },
    {
      id: 'yeah_level_4',
      title: 'Réussite',
      description: "Consolidez votre entreprise et visez l'excellence.",
      order: 4,
      xpRequired: 40000,
      deliverableType: 'business_plan_full',
      posture: 'Champion',
      iconName: 'trophy-outline',
      subLevels: [
        {
          id: 'yeah_level_4_sub_1',
          title: 'Croissance',
          description: 'Développez votre activité.',
          order: 1,
          xpRequired: 10000,
          xpReward: 10000,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'duel'],
          rules: { captureEnabled: true, sequentialRequired: false },
        },
        {
          id: 'yeah_level_4_sub_2',
          title: 'Innovation',
          description: 'Innovez pour rester compétitif.',
          order: 2,
          xpRequired: 20000,
          xpReward: 10000,
          deliverables: [],
          cardCategories: ['quiz', 'opportunity', 'duel'],
          rules: { captureEnabled: true, sequentialRequired: false },
        },
        {
          id: 'yeah_level_4_sub_3',
          title: 'Impact',
          description: 'Mesurez et amplifiez votre impact.',
          order: 3,
          xpRequired: 30000,
          xpReward: 10000,
          deliverables: [],
          cardCategories: ['quiz', 'challenge', 'opportunity'],
          rules: { captureEnabled: true, sequentialRequired: false },
        },
        {
          id: 'yeah_level_4_sub_4',
          title: 'Leadership',
          description: 'Devenez un leader inspirant.',
          order: 4,
          xpRequired: 40000,
          xpReward: 10000,
          deliverables: [],
          cardCategories: ['quiz', 'duel', 'funding'],
          rules: { captureEnabled: true, sequentialRequired: false },
        },
      ],
    },
  ],
  sectors: [
    {
      id: 'yeah_sector_vegetal',
      name: 'Production végétale',
      description:
        'Cultures maraîchères, céréales, fruits et légumes. Apprenez les techniques agricoles modernes.',
      icon: 'leaf-outline',
      category: 'agriculture',
      homeNames: ['Semences', 'Irrigation', 'Récolte', 'Stockage'],
      color: '#4CAF50',
    },
    {
      id: 'yeah_sector_elevage',
      name: 'Élevage',
      description:
        "Bovins, ovins, volailles et aquaculture. Maîtrisez la gestion d'un cheptel rentable.",
      icon: 'paw-outline',
      category: 'agriculture',
      homeNames: ['Alimentation', 'Santé', 'Reproduction', 'Commercialisation'],
      color: '#8B4513',
    },
    {
      id: 'yeah_sector_transformation',
      name: 'Transformation',
      description:
        'Agroalimentaire, conservation, conditionnement. Créez de la valeur ajoutée.',
      icon: 'construct-outline',
      category: 'agriculture',
      homeNames: ['Matières premières', 'Process', 'Qualité', 'Distribution'],
      color: '#FF9800',
    },
    {
      id: 'yeah_sector_services',
      name: 'Services agricoles',
      description:
        "Conseil, mécanisation, logistique, fintech agricole. Innovez dans l'écosystème.",
      icon: 'settings-outline',
      category: 'services',
      homeNames: ['Conseil', 'Équipement', 'Logistique', 'Digital'],
      color: '#2196F3',
    },
  ],
  createdAt: Date.now(),
};

// ===== CALL ADMIN API =====

async function main() {
  console.log('Pushing YEAH challenge via admin API...');
  console.log(`Target: ${ADMIN_URL}`);

  try {
    const res = await fetch(ADMIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenges: [YEAH_PROGRAM] }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('❌ API error:', data);
      process.exit(1);
    }

    console.log('✅', data.message);
    for (const r of data.results) {
      console.log(`   [${r.collection}] ${r.id}: ${r.status}`, r.counts ? JSON.stringify(r.counts) : '');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Assure-toi que l\'admin dashboard tourne:');
    console.error('  cd startup-ludo-admin && npm run dev');
    process.exit(1);
  }
}

main();
