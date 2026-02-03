import type { DuelQuestion } from '@/types';

export const DUEL_QUESTIONS: DuelQuestion[] = [
  {
    id: 'duel-q1',
    question: "Une bonne proposition de valeur doit communiquer quoi en priorité?",
    options: [
      { text: "Le problème résolu et le bénéfice client", points: 30 },
      { text: "L'histoire et la vision du fondateur", points: 20 },
      { text: "Les technologies utilisées et les fonctionnalités", points: 10 },
    ],
    category: 'business',
  },
  {
    id: 'duel-q2',
    question: "Quel est le meilleur moment pour lever des fonds?",
    options: [
      { text: "Quand on a une traction prouvée et des métriques solides", points: 30 },
      { text: "Dès qu'on a une idée prometteuse", points: 10 },
      { text: "Quand on a un prototype fonctionnel", points: 20 },
    ],
    category: 'financement',
  },
  {
    id: 'duel-q3',
    question: "Comment valider une idée de startup efficacement?",
    options: [
      { text: "Parler à des clients potentiels et tester avec un MVP", points: 30 },
      { text: "Faire une étude de marché complète", points: 20 },
      { text: "Demander l'avis de ses proches", points: 10 },
    ],
    category: 'validation',
  },
  {
    id: 'duel-q4',
    question: "Quel indicateur est le plus important pour une startup early-stage?",
    options: [
      { text: "Le taux de rétention des utilisateurs", points: 30 },
      { text: "Le nombre de téléchargements", points: 10 },
      { text: "Le chiffre d'affaires mensuel", points: 20 },
    ],
    category: 'métriques',
  },
  {
    id: 'duel-q5',
    question: "Quelle est la meilleure approche pour recruter les premiers employés?",
    options: [
      { text: "Chercher des personnes passionnées par la mission", points: 30 },
      { text: "Recruter uniquement des profils expérimentés", points: 20 },
      { text: "Offrir les meilleurs salaires du marché", points: 10 },
    ],
    category: 'recrutement',
  },
  {
    id: 'duel-q6',
    question: "Comment gérer efficacement son cash burn?",
    options: [
      { text: "Prioriser les dépenses qui génèrent de la croissance", points: 30 },
      { text: "Réduire toutes les dépenses au minimum", points: 20 },
      { text: "Investir massivement en marketing", points: 10 },
    ],
    category: 'finance',
  },
  {
    id: 'duel-q7',
    question: "Quel est le secret d'un bon pitch?",
    options: [
      { text: "Raconter une histoire convaincante avec des chiffres clés", points: 30 },
      { text: "Présenter toutes les fonctionnalités du produit", points: 10 },
      { text: "Montrer un business plan détaillé sur 5 ans", points: 20 },
    ],
    category: 'pitch',
  },
  {
    id: 'duel-q8',
    question: "Comment choisir son co-fondateur idéal?",
    options: [
      { text: "Quelqu'un avec des compétences complémentaires et des valeurs alignées", points: 30 },
      { text: "Son meilleur ami pour la confiance", points: 10 },
      { text: "Un expert technique reconnu", points: 20 },
    ],
    category: 'équipe',
  },
  {
    id: 'duel-q9',
    question: "Quelle stratégie de pricing est la plus efficace au lancement?",
    options: [
      { text: "Tester différents prix et analyser les conversions", points: 30 },
      { text: "S'aligner sur les prix des concurrents", points: 20 },
      { text: "Proposer le prix le plus bas possible", points: 10 },
    ],
    category: 'pricing',
  },
  {
    id: 'duel-q10',
    question: "Comment réagir face à un concurrent qui copie votre produit?",
    options: [
      { text: "Se concentrer sur l'innovation et la relation client", points: 30 },
      { text: "Baisser ses prix pour rester compétitif", points: 10 },
      { text: "Accélérer le développement de nouvelles fonctionnalités", points: 20 },
    ],
    category: 'stratégie',
  },
  {
    id: 'duel-q11',
    question: "Quel canal d'acquisition privilégier au début?",
    options: [
      { text: "Celui qui permet de parler directement aux clients cibles", points: 30 },
      { text: "Les réseaux sociaux car c'est gratuit", points: 20 },
      { text: "La publicité payante pour aller vite", points: 10 },
    ],
    category: 'marketing',
  },
  {
    id: 'duel-q12',
    question: "Comment structurer une équipe produit efficace?",
    options: [
      { text: "Des équipes autonomes centrées sur des objectifs utilisateur", points: 30 },
      { text: "Une hiérarchie claire avec des rôles définis", points: 20 },
      { text: "Tout le monde fait tout selon les besoins", points: 10 },
    ],
    category: 'organisation',
  },
];

/**
 * Retourne un ensemble aléatoire de questions pour un duel
 * @param count Nombre de questions (par défaut 3)
 */
export function getRandomDuelQuestions(count: number = 3): DuelQuestion[] {
  const shuffled = [...DUEL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Génère un score aléatoire pour l'IA
 * Simule comme si l'IA avait répondu aux 3 questions
 */
export function generateAIScore(): number {
  // Scores possibles: chaque question donne 10, 20 ou 30 points
  // Total min: 30 (10+10+10), max: 90 (30+30+30)
  const possibleScores = [30, 40, 50, 60, 70, 80, 90];
  const index = Math.floor(Math.random() * possibleScores.length);
  return possibleScores[index] ?? 50;
}

/**
 * Calcule le score total à partir des réponses
 */
export function calculateScore(questions: DuelQuestion[], answers: number[]): number {
  return answers.reduce((total, answerIndex, questionIndex) => {
    const question = questions[questionIndex];
    if (question && question.options[answerIndex]) {
      return total + (question.options[answerIndex].points || 0);
    }
    return total;
  }, 0);
}
