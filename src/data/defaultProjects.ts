/**
 * Projets par defaut et mapping edition-secteurs
 *
 * Chaque edition a 4 startups fictives (templates) que les joueurs
 * peuvent choisir s'ils n'ont pas de startup personnelle du bon secteur.
 *
 * Supporte le hot-swap depuis Firestore via refreshDefaultProjectsFromFirestore().
 */

import { collection, getDocs } from 'firebase/firestore';
import { firestore, FIRESTORE_COLLECTIONS } from '@/services/firebase/config';
import { cachedFetch } from '@/services/firebase/cacheHelper';
import type { Startup } from '@/types';

// ===== TYPES =====

export type EditionId = 'classic';

// Import du type depuis types.ts pour cohérence
import type { DefaultProject as NewDefaultProject } from './types';

// Re-export le type
export type DefaultProject = NewDefaultProject;

// ===== EDITION -> SECTEURS =====

export const EDITION_SECTORS: Record<EditionId, string[]> = {
  classic: [
    'fintech', 'mobilite', 'proptech', 'e-commerce', 'gaming', 'greentech',
    'foodtech', 'entertainment-media', 'agritech', 'cybersecurite',
    'energie-renouvelable', 'sport-fitness', 'tourisme',
    'mobile-telecommunications', 'logistique-supply-chain', 'edtech',
    'cleantech-environnement',
  ],
};

// ===== PROJETS PAR DEFAUT (4 par edition) =====

const LOCAL_DEFAULT_PROJECTS: Record<EditionId, DefaultProject[]> = {
  classic: [
    {
      id: 'default_classic_1',
      name: 'MobiPay',
      sector: 'fintech',
      description: 'Paiement mobile pour les marches informels africains',
      target: 'Commerçants et marchands informels',
      mission: 'Democratiser le paiement digital en Afrique',
    },
    {
      id: 'default_classic_2',
      name: 'TerraConnect',
      sector: 'logistique-supply-chain',
      description: 'Plateforme de livraison du dernier kilometre en Afrique de l\'Ouest',
      target: 'E-commercants et PME',
      mission: 'Rendre la livraison accessible partout',
    },
    {
      id: 'default_classic_3',
      name: 'SunGrid',
      sector: 'energie-renouvelable',
      description: 'Micro-reseaux solaires pour les communautes rurales',
      target: 'Communautes rurales et villages',
      mission: 'Electrifier l\'Afrique rurale durablement',
    },
    {
      id: 'default_classic_4',
      name: 'ShopNaija',
      sector: 'e-commerce',
      description: 'Marketplace de produits artisanaux Made in Africa',
      target: 'Artisans et acheteurs internationaux',
      mission: 'Valoriser l\'artisanat africain mondialement',
    },
  ],
};

// Mutable — commence avec les données locales, mis à jour par Firestore
// eslint-disable-next-line import/no-mutable-exports
export let DEFAULT_PROJECTS: Record<EditionId, DefaultProject[]> = { ...LOCAL_DEFAULT_PROJECTS };

/**
 * Fetch les projets par défaut depuis Firestore (sans cache).
 * NOTE: Maintenant les defaultProjects sont intégrés directement dans les éditions,
 * cette fonction n'est utilisée que pour la backward compatibility.
 */
async function fetchDefaultProjectsFromFirestore(): Promise<Record<EditionId, DefaultProject[]>> {
  const snapshot = await getDocs(collection(firestore, FIRESTORE_COLLECTIONS.defaultProjects));
  if (snapshot.empty) return { ...LOCAL_DEFAULT_PROJECTS };

  const remoteByEdition: Record<string, DefaultProject[]> = {};
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    // Récupérer l'édition depuis le champ ou utiliser 'classic' par défaut
    const edition = (data.edition || 'classic') as string;
    const proj: DefaultProject = {
      id: doc.id,
      name: data.name || '',
      sector: data.sector || '',
      description: data.description || '',
      target: data.target || '',
      mission: data.mission || '',
      initialBudget: data.initialBudget,
    };
    if (!remoteByEdition[edition]) {
      remoteByEdition[edition] = [];
    }
    remoteByEdition[edition]!.push(proj);
  });

  // Merge: remote prend la priorité par édition, local est fallback
  const merged = { ...LOCAL_DEFAULT_PROJECTS };
  for (const [editionId, projects] of Object.entries(remoteByEdition)) {
    if (projects.length > 0) {
      merged[editionId as EditionId] = projects;
    }
  }
  return merged;
}

/**
 * Charge les projets par défaut : AsyncStorage d'abord, puis Firestore si stale (>24h).
 */
export async function refreshDefaultProjectsFromFirestore(): Promise<void> {
  try {
    await cachedFetch<Record<EditionId, DefaultProject[]>>(
      'defaultProjects',
      fetchDefaultProjectsFromFirestore,
      (data) => {
        DEFAULT_PROJECTS = data;
      }
    );
  } catch {
    console.warn('[Data] Default projects: no data available, using local fallback');
  }
}

// ===== HELPERS =====

/**
 * Retourne les projets par defaut pour une edition donnee.
 * Priorité : defaultProjects de l'édition > projets Firestore > fallback local
 */
export function getDefaultProjectsForEdition(editionId: string): DefaultProject[] {
  // Import dynamique pour éviter la dépendance circulaire
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getEdition } = require('./index');

  // Récupérer l'édition depuis la fonction getEdition
  const editionData = getEdition(editionId);

  // Debug log
  console.log(`[DefaultProjects] Edition ${editionId}: ${editionData?.defaultProjects?.length || 0} defaultProjects from edition`);

  // Si l'édition a des defaultProjects générés, les utiliser
  if (editionData?.defaultProjects && editionData.defaultProjects.length > 0) {
    console.log(`[DefaultProjects] Using ${editionData.defaultProjects.length} projects from edition ${editionId}`);
    // Mapper vers le format DefaultProject local si nécessaire
    return editionData.defaultProjects.map((p: DefaultProject) => ({
      id: p.id,
      name: p.name,
      sector: p.sector,
      description: p.description,
      target: p.target || '',
      mission: p.mission || '',
      initialBudget: p.initialBudget,
    }));
  }

  // Sinon fallback : projets Firestore ou locaux
  console.log(`[DefaultProjects] Fallback to local projects for ${editionId}`);
  return DEFAULT_PROJECTS[editionId as EditionId] ?? DEFAULT_PROJECTS.classic ?? [];
}

/**
 * Filtre les startups de l'utilisateur pour ne garder que celles
 * dont le secteur correspond a l'edition choisie.
 */
export function getMatchingUserStartups(startups: Startup[], editionId: string): Startup[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getEdition } = require('./index');

  // Récupérer l'édition depuis la fonction getEdition
  const editionData = getEdition(editionId);
  const sectors = editionData?.sectors || EDITION_SECTORS[editionId as EditionId] || EDITION_SECTORS.classic;

  if (!sectors || sectors.length === 0) {
    return startups; // Pas de filtre si pas de secteurs
  }

  return startups.filter((s) => sectors.includes(s.sector));
}

/**
 * Retourne true si le startupId est un projet du portfolio (pas un template).
 */
export function isOwnStartup(startupId: string | undefined): boolean {
  if (!startupId) return false;
  return !startupId.startsWith('default_');
}

/**
 * Retourne l'édition correspondant à un secteur donné.
 * Parcourt EDITION_SECTORS pour trouver l'édition contenant ce secteur.
 * Fallback: 'classic' si non trouvé.
 */
export function getSectorEdition(sector: string): EditionId {
  if (!sector) return 'classic';
  const normalizedSector = sector.toLowerCase();
  for (const [editionId, sectors] of Object.entries(EDITION_SECTORS)) {
    if (sectors.includes(normalizedSector)) {
      return editionId as EditionId;
    }
  }
  return 'classic';
}
