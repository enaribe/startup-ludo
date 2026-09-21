/**
 * Un habillage d'édition doit-il s'afficher ?
 *
 * POURQUOI CETTE FONCTION EXISTE : la condition était écrite en double, dans
 * `local-setup` et `create-room`, et ne testait que `enabled` et `imageUrl`.
 * `paused` — écrit par le back-office dès qu'un annonceur met sa diffusion en
 * pause — n'était lu NULLE PART dans le jeu : le popup continuait de
 * s'afficher, et chaque affichage était compté et facturé alors que
 * l'annonceur croyait sa diffusion arrêtée.
 *
 * Les quatre critères vivent donc ici, à un seul endroit. Le prochain qui
 * s'ajoute vaudra pour les deux écrans sans qu'on ait à y penser.
 */
import type { EditionSponsor } from '@/data/types';

export function habillageDiffusable(sponsor?: EditionSponsor | null): boolean {
  if (!sponsor?.enabled) return false;
  // Pause décidée par l'annonceur ou par CONCREE : réversible, mais tant
  // qu'elle dure rien ne s'affiche.
  if (sponsor.paused === true) return false;
  // Fin d'exclusivité : la période payée s'arrête au dernier mois réservé.
  // L'entretien qui éteint `enabled` est déclenché à la main et peut tarder —
  // sans cette borne, l'habillage déborderait sur le créneau du suivant.
  if (typeof sponsor.endAt === 'number' && Date.now() > sponsor.endAt) return false;
  // Sans visuel, l'écran sponsor n'a rien à montrer.
  return Boolean(sponsor.imageUrl);
}
