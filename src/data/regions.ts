/**
 * Régions déclaratives du joueur — Espace Annonceur, lot 2.
 *
 * POURQUOI DÉCLARATIF (et pas une géolocalisation) : le besoin est grossier
 * (14 régions + diaspora), des mineurs jouent (Mode Classe), et une déclaration
 * marche hors-ligne, sans permission système, et reste stable dans le temps.
 * C'est la décision produit actée au plan Espace Annonceur (§3).
 *
 * Les identifiants sont des slugs SANS accent ni point : ils servent de clés de
 * map Firestore (`byRegion.{id}`) où « . » et « / » sont interdits, et doivent
 * rester stables même si le libellé affiché change.
 *
 * Les libellés sont des noms propres : identiques en français et en anglais,
 * ils vivent ici et non dans i18n.
 */

export interface PlayerRegion {
  id: string;
  label: string;
}

/** Les 14 régions administratives du Sénégal, puis la diaspora. */
export const PLAYER_REGIONS: PlayerRegion[] = [
  { id: 'dakar', label: 'Dakar' },
  { id: 'diourbel', label: 'Diourbel' },
  { id: 'fatick', label: 'Fatick' },
  { id: 'kaffrine', label: 'Kaffrine' },
  { id: 'kaolack', label: 'Kaolack' },
  { id: 'kedougou', label: 'Kédougou' },
  { id: 'kolda', label: 'Kolda' },
  { id: 'louga', label: 'Louga' },
  { id: 'matam', label: 'Matam' },
  { id: 'saint-louis', label: 'Saint-Louis' },
  { id: 'sedhiou', label: 'Sédhiou' },
  { id: 'tambacounda', label: 'Tambacounda' },
  { id: 'thies', label: 'Thiès' },
  { id: 'ziguinchor', label: 'Ziguinchor' },
  { id: 'diaspora', label: 'Hors du Sénégal (diaspora)' },
];

/** Libellé d'une région par son id (id inconnu → id brut, jamais un crash). */
export function regionLabel(id: string | undefined | null): string {
  if (!id) return '';
  return PLAYER_REGIONS.find((r) => r.id === id)?.label ?? id;
}
