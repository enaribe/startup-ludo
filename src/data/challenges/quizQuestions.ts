export interface FinalQuizQuestion {
  id: string;
  block: number;
  blockName: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const YEAH_FINAL_QUIZ: FinalQuizQuestion[] = [
  { id: 'q1', block: 1, blockName: 'Découverte', question: "Quel est le premier pas pour valider une idée d'entreprise agricole ?", options: ["Emprunter de l'argent", "Étudier le marché et les besoins", "Acheter du matériel", "Créer un logo"], correctAnswer: 1 },
  { id: 'q2', block: 1, blockName: 'Découverte', question: "Qu'est-ce qu'une étude de marché ?", options: ["Un document bancaire", "Une analyse des clients, concurrents et opportunités", "Un plan de culture", "Un certificat officiel"], correctAnswer: 1 },
  { id: 'q3', block: 1, blockName: 'Découverte', question: "Quel secteur agricole concerne la transformation des matières premières ?", options: ["L'élevage", "La production végétale", "L'agroalimentaire", "Les services agricoles"], correctAnswer: 2 },
  { id: 'q4', block: 1, blockName: 'Découverte', question: "Pourquoi est-il important de connaître plusieurs secteurs avant de se lancer ?", options: ["Pour impressionner les investisseurs", "Pour identifier les meilleures opportunités", "Ce n'est pas important", "Pour copier les concurrents"], correctAnswer: 1 },
  { id: 'q5', block: 2, blockName: 'Idéation', question: "Qu'est-ce qu'une proposition de valeur ?", options: ["Le prix de vente", "Ce qui rend votre offre unique et attractive", "Le capital de l'entreprise", "Un slogan publicitaire"], correctAnswer: 1 },
  { id: 'q6', block: 2, blockName: 'Idéation', question: "Un bon pitch doit inclure :", options: ["Uniquement les chiffres financiers", "Le problème, la solution, la cible et l'impact", "Le CV du fondateur", "La liste des concurrents"], correctAnswer: 1 },
  { id: 'q7', block: 2, blockName: 'Idéation', question: "Comment identifier un bon problème à résoudre ?", options: ["En inventant un besoin", "En observant les difficultés réelles des gens", "En copiant une entreprise existante", "En suivant la mode"], correctAnswer: 1 },
  { id: 'q8', block: 2, blockName: 'Idéation', question: "Qu'est-ce qu'un marché cible ?", options: ["Tous les habitants du pays", "Le groupe spécifique de clients visés", "Les concurrents", "Les fournisseurs"], correctAnswer: 1 },
  { id: 'q9', block: 3, blockName: 'Démarrage', question: "Qu'est-ce qu'un modèle économique ?", options: ["Un plan architectural", "La façon dont l'entreprise génère des revenus", "Un logiciel de gestion", "Un type de société"], correctAnswer: 1 },
  { id: 'q10', block: 3, blockName: 'Démarrage', question: "Pourquoi faire un plan financier prévisionnel ?", options: ["C'est obligatoire par la loi", "Pour anticiper les besoins en trésorerie", "Pour payer moins d'impôts", "Pour impressionner les amis"], correctAnswer: 1 },
  { id: 'q11', block: 3, blockName: 'Démarrage', question: "Quelle est la première étape pour formaliser son entreprise ?", options: ["Ouvrir un bureau", "Choisir le statut juridique adapté", "Embaucher du personnel", "Commander des cartes de visite"], correctAnswer: 1 },
  { id: 'q12', block: 3, blockName: 'Démarrage', question: "Qu'est-ce que le seuil de rentabilité ?", options: ["Le chiffre d'affaires maximum", "Le point où les revenus couvrent les charges", "Le montant du capital social", "Le salaire du dirigeant"], correctAnswer: 1 },
  { id: 'q13', block: 4, blockName: 'Réussite', question: "Quelle stratégie aide à la croissance d'une entreprise agricole ?", options: ["Réduire la qualité pour baisser les prix", "Diversifier les produits et les marchés", "Arrêter d'investir", "Copier exactement les concurrents"], correctAnswer: 1 },
  { id: 'q14', block: 4, blockName: 'Réussite', question: "Comment mesurer l'impact social d'une entreprise ?", options: ["Par le nombre d'employés uniquement", "Par des indicateurs sociaux, économiques et environnementaux", "Par le chiffre d'affaires", "Ce n'est pas mesurable"], correctAnswer: 1 },
  { id: 'q15', block: 4, blockName: 'Réussite', question: "Qu'est-ce que l'innovation en agriculture ?", options: ["Utiliser uniquement la technologie", "Trouver de nouvelles façons de créer de la valeur", "Abandonner les méthodes traditionnelles", "Augmenter les prix"], correctAnswer: 1 },
  { id: 'q16', block: 4, blockName: 'Réussite', question: "Quelle qualité est essentielle pour un leader entrepreneur ?", options: ["Tout faire soi-même", "Savoir déléguer et inspirer son équipe", "Éviter les risques", "Ne jamais changer de stratégie"], correctAnswer: 1 },
];

export const QUIZ_PASS_THRESHOLD = 0.75;
