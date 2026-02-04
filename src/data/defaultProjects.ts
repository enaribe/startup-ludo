/**
 * Projets par defaut et mapping edition-secteurs
 *
 * Chaque edition a 4 startups fictives (templates) que les joueurs
 * peuvent choisir s'ils n'ont pas de startup personnelle du bon secteur.
 */

import type { Startup } from '@/types';

// ===== TYPES =====

export type EditionId = 'classic' | 'agriculture' | 'education' | 'sante' | 'tourisme' | 'culture';

export interface DefaultProject {
  id: string;
  name: string;
  sector: string;
  description: string;
  edition: EditionId;
}

// ===== EDITION -> SECTEURS =====

export const EDITION_SECTORS: Record<EditionId, string[]> = {
  classic: [
    'fintech', 'mobilite', 'proptech', 'e-commerce', 'gaming', 'greentech',
    'foodtech', 'entertainment-media', 'agritech', 'cybersecurite',
    'energie-renouvelable', 'sport-fitness', 'tourisme',
    'mobile-telecommunications', 'logistique-supply-chain', 'edtech',
    'cleantech-environnement',
  ],
  agriculture: ['agritech', 'foodtech', 'greentech', 'cleantech-environnement'],
  education: ['edtech'],
  sante: ['cybersecurite'],
  tourisme: ['tourisme'],
  culture: ['entertainment-media'],
};

// ===== PROJETS PAR DEFAUT (4 par edition) =====

export const DEFAULT_PROJECTS: Record<EditionId, DefaultProject[]> = {
  classic: [
    {
      id: 'default_classic_1',
      name: 'MobiPay',
      sector: 'fintech',
      description: 'Paiement mobile pour les marches informels africains',
      edition: 'classic',
    },
    {
      id: 'default_classic_2',
      name: 'TerraConnect',
      sector: 'logistique-supply-chain',
      description: 'Plateforme de livraison du dernier kilometre en Afrique de l\'Ouest',
      edition: 'classic',
    },
    {
      id: 'default_classic_3',
      name: 'SunGrid',
      sector: 'energie-renouvelable',
      description: 'Micro-reseaux solaires pour les communautes rurales',
      edition: 'classic',
    },
    {
      id: 'default_classic_4',
      name: 'ShopNaija',
      sector: 'e-commerce',
      description: 'Marketplace de produits artisanaux Made in Africa',
      edition: 'classic',
    },
  ],

  agriculture: [
    {
      id: 'default_agri_1',
      name: 'AgroSense',
      sector: 'agritech',
      description: 'Capteurs IoT pour le suivi des cultures en temps reel',
      edition: 'agriculture',
    },
    {
      id: 'default_agri_2',
      name: 'FarmLink',
      sector: 'foodtech',
      description: 'Connexion directe producteurs-restaurateurs sans intermediaires',
      edition: 'agriculture',
    },
    {
      id: 'default_agri_3',
      name: 'VerdeStock',
      sector: 'greentech',
      description: 'Solution de stockage ecologique pour les recoltes',
      edition: 'agriculture',
    },
    {
      id: 'default_agri_4',
      name: 'AquaPure',
      sector: 'cleantech-environnement',
      description: 'Systeme de traitement d\'eau pour l\'irrigation agricole',
      edition: 'agriculture',
    },
  ],

  education: [
    {
      id: 'default_edu_1',
      name: 'LearnAfrika',
      sector: 'edtech',
      description: 'Cours en ligne adaptes aux programmes scolaires africains',
      edition: 'education',
    },
    {
      id: 'default_edu_2',
      name: 'SkillForge',
      sector: 'edtech',
      description: 'Formation professionnelle par la realite virtuelle',
      edition: 'education',
    },
    {
      id: 'default_edu_3',
      name: 'KidoCode',
      sector: 'edtech',
      description: 'Apprentissage du code pour les enfants de 6 a 14 ans',
      edition: 'education',
    },
    {
      id: 'default_edu_4',
      name: 'TutorZone',
      sector: 'edtech',
      description: 'Mise en relation eleves et tuteurs certifies',
      edition: 'education',
    },
  ],

  sante: [
    {
      id: 'default_sante_1',
      name: 'MediGuard',
      sector: 'cybersecurite',
      description: 'Protection des donnees medicales pour les hopitaux',
      edition: 'sante',
    },
    {
      id: 'default_sante_2',
      name: 'PharmaSafe',
      sector: 'cybersecurite',
      description: 'Tracabilite securisee des medicaments contre la contrefacon',
      edition: 'sante',
    },
    {
      id: 'default_sante_3',
      name: 'HealthID',
      sector: 'cybersecurite',
      description: 'Identite numerique securisee pour les patients',
      edition: 'sante',
    },
    {
      id: 'default_sante_4',
      name: 'CyberClinic',
      sector: 'cybersecurite',
      description: 'Audit de securite informatique pour les centres de sante',
      edition: 'sante',
    },
  ],

  tourisme: [
    {
      id: 'default_tour_1',
      name: 'SafariBook',
      sector: 'tourisme',
      description: 'Reservation d\'experiences eco-touristiques en Afrique',
      edition: 'tourisme',
    },
    {
      id: 'default_tour_2',
      name: 'LocalGuide',
      sector: 'tourisme',
      description: 'Plateforme de guides locaux certifies',
      edition: 'tourisme',
    },
    {
      id: 'default_tour_3',
      name: 'HeritageMap',
      sector: 'tourisme',
      description: 'Circuits immersifs du patrimoine culturel africain',
      edition: 'tourisme',
    },
    {
      id: 'default_tour_4',
      name: 'StayLocal',
      sector: 'tourisme',
      description: 'Hebergement chez l\'habitant en milieu rural',
      edition: 'tourisme',
    },
  ],

  culture: [
    {
      id: 'default_culture_1',
      name: 'AfroStream',
      sector: 'entertainment-media',
      description: 'Plateforme de streaming de contenus africains',
      edition: 'culture',
    },
    {
      id: 'default_culture_2',
      name: 'BeatMakers',
      sector: 'entertainment-media',
      description: 'Studio de production musicale en ligne pour artistes africains',
      edition: 'culture',
    },
    {
      id: 'default_culture_3',
      name: 'StoryTell',
      sector: 'entertainment-media',
      description: 'Edition et diffusion de bandes dessinees africaines numeriques',
      edition: 'culture',
    },
    {
      id: 'default_culture_4',
      name: 'FestivalHub',
      sector: 'entertainment-media',
      description: 'Billetterie et promotion d\'evenements culturels',
      edition: 'culture',
    },
  ],
};

// ===== HELPERS =====

/**
 * Retourne les 4 projets par defaut pour une edition donnee.
 * Fallback sur 'classic' si l'edition n'existe pas.
 */
export function getDefaultProjectsForEdition(edition: string): DefaultProject[] {
  return DEFAULT_PROJECTS[edition as EditionId] ?? DEFAULT_PROJECTS.classic;
}

/**
 * Filtre les startups de l'utilisateur pour ne garder que celles
 * dont le secteur correspond a l'edition choisie.
 */
export function getMatchingUserStartups(startups: Startup[], edition: string): Startup[] {
  const sectors = EDITION_SECTORS[edition as EditionId] ?? EDITION_SECTORS.classic;
  return startups.filter((s) => sectors.includes(s.sector));
}

/**
 * Retourne true si le startupId est un projet du portfolio (pas un template).
 */
export function isOwnStartup(startupId: string | undefined): boolean {
  if (!startupId) return false;
  return !startupId.startsWith('default_');
}
