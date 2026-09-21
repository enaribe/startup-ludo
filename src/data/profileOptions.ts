/**
 * Options du profil déclaratif joueur — écran « Fais-nous connaissance »
 * ((auth)/profile-details), posé une seule fois avant l'accueil.
 *
 * Les ids sont STABLES : ils partent dans Firestore (`users/{uid}`) et
 * Amplitude (propriétés utilisateur), et l'Espace Annonceur web cible dessus
 * (tranche d'âge, situation — mêmes filtres que sa page « Qui verra votre
 * écran sponsor ? »). Ne jamais les renommer sans migrer les deux côtés.
 *
 * Les libellés vivent dans i18n (fr/en).
 */

import type { Ionicons } from '@expo/vector-icons';

import type { TranslationKey } from '@/i18n';
import type { UserProfile } from '@/types';

interface ProfileOption {
  id: string;
  labelKey: TranslationKey;
}

/** Tranches d'âge — alignées sur les filtres de l'Espace Annonceur (+ mineurs, Mode Classe). */
export const AGE_RANGES: ProfileOption[] = [
  { id: 'moins_18', labelKey: 'profileDetails.age.moins_18' },
  { id: '18_24', labelKey: 'profileDetails.age.18_24' },
  { id: '25_34', labelKey: 'profileDetails.age.25_34' },
  { id: '35_plus', labelKey: 'profileDetails.age.35_plus' },
];

/** Situations (multi-sélection) — mêmes valeurs que le ciblage annonceur. */
export const SITUATIONS: ProfileOption[] = [
  { id: 'etudiant', labelKey: 'profileDetails.situation.etudiant' },
  { id: 'entrepreneur', labelKey: 'profileDetails.situation.entrepreneur' },
  { id: 'porteur_projet', labelKey: 'profileDetails.situation.porteur_projet' },
  { id: 'autre', labelKey: 'profileDetails.situation.autre' },
];

/** Canaux de découverte de l'app (question « comment as-tu connu le jeu ? »). */
export const ACQUISITION_SOURCES: (ProfileOption & {
  icon: keyof typeof Ionicons.glyphMap;
})[] = [
  { id: 'bouche_a_oreille', icon: 'chatbubbles-outline', labelKey: 'acquisition.opt.bouche_a_oreille' },
  { id: 'tiktok', icon: 'logo-tiktok', labelKey: 'acquisition.opt.tiktok' },
  { id: 'instagram', icon: 'logo-instagram', labelKey: 'acquisition.opt.instagram' },
  { id: 'facebook', icon: 'logo-facebook', labelKey: 'acquisition.opt.facebook' },
  { id: 'whatsapp', icon: 'logo-whatsapp', labelKey: 'acquisition.opt.whatsapp' },
  { id: 'linkedin', icon: 'logo-linkedin', labelKey: 'acquisition.opt.linkedin' },
  { id: 'ecole_programme', icon: 'school-outline', labelKey: 'acquisition.opt.ecole_programme' },
  { id: 'evenement', icon: 'calendar-outline', labelKey: 'acquisition.opt.evenement' },
  { id: 'store', icon: 'storefront-outline', labelKey: 'acquisition.opt.store' },
  { id: 'autre', icon: 'ellipsis-horizontal-circle-outline', labelKey: 'acquisition.opt.autre' },
];

/**
 * Le profil déclaratif est-il complet ? (région + âge + situation).
 * Le canal d'acquisition n'est PAS bloquant : posé dans la même page s'il
 * manque, mais son absence seule ne rouvre pas l'écran.
 */
export function isProfileDetailsComplete(profile: UserProfile): boolean {
  return !!(profile.region && profile.ageRange && profile.situations?.length);
}
