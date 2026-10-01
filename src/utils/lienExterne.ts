/**
 * Ouverture d'un lien externe d'annonceur.
 *
 * POURQUOI CETTE FONCTION EXISTE : `Linking.openURL` exige un schéma. Une
 * campagne dont le lien était saisi « concree.com » (sans https://) produisait
 * un rejet silencieux — le joueur appuyait sur « POSTULER » ou sur une
 * opportunité sauvegardée, et il ne se passait rien. Les deux appelants
 * avalaient l'erreur dans un `.catch()`, donc rien ne le signalait.
 *
 * C'est un défaut de saisie qu'on ne peut pas exiger de l'annonceur : dans un
 * champ « lien », « concree.com » est une réponse légitime.
 */
import { Linking } from 'react-native';

/**
 * Complète un lien saisi sans schéma.
 *
 * `https` et non `http` : un lien d'annonceur pointe vers un site public, et
 * iOS bloque le trafic en clair par défaut (App Transport Security). Les
 * schémas déjà présents — y compris `mailto:` et `tel:`, qu'un annonceur peut
 * légitimement vouloir — sont laissés intacts.
 */
export function normaliserLien(url: string): string {
  const propre = url.trim();
  if (!propre) return '';
  return /^[a-z][a-z0-9+.-]*:/i.test(propre) ? propre : `https://${propre}`;
}

/**
 * Ouvre le lien, en le normalisant d'abord.
 *
 * Ne jette jamais : un lien mort ne doit pas interrompre une partie. Le retour
 * dit si l'ouverture a réussi, pour que l'appelant puisse le signaler au
 * joueur plutôt que de le laisser devant un bouton sans effet.
 */
export async function ouvrirLienExterne(url?: string | null): Promise<boolean> {
  const cible = normaliserLien(url ?? '');
  if (!cible) return false;
  try {
    await Linking.openURL(cible);
    return true;
  } catch {
    return false;
  }
}
