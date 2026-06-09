/**
 * currency.ts — Utilitaire d'affichage monétaire en Petaw (Ptw)
 *
 * Devise officielle du jeu : le Petaw (abrégé « Ptw »).
 * Taux de conversion : 1000 FCFA = 1 Ptw.
 *
 * Les valeurs internes restent stockées en FCFA (héritage), on convertit
 * uniquement à l'affichage en divisant par 1000.
 */

/** 1 Ptw vaut 1000 FCFA. */
export const FCFA_PER_PTW = 1000;

/** Taux de conversion EUR → FCFA : 1€ = 655,957 XOF (CFA Franc BCEAO). */
export const EUR_TO_FCFA = 655.957;

/** Convertit une valeur EUR en FCFA (valeur interne). */
export function toFCFA(eur: number): number {
  return Math.round(eur * EUR_TO_FCFA);
}

/** Convertit une valeur FCFA en Petaw. */
export function toPtw(fcfa: number): number {
  return fcfa / FCFA_PER_PTW;
}

/**
 * Formate un nombre de Petaw en chaîne abrégée avec le suffixe « Ptw ».
 * Ex: 2_000_000 → "2M Ptw"
 *     1_200     → "1,2K Ptw"
 *     35        → "35 Ptw"
 *     12,5      → "12,5 Ptw"
 */
function formatPtwAmount(ptw: number): string {
  if (ptw >= 1_000_000_000) {
    return `${(ptw / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',')}Md Ptw`;
  }
  if (ptw >= 1_000_000) {
    return `${(ptw / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',')}M Ptw`;
  }
  if (ptw >= 1_000) {
    return `${(ptw / 1_000).toFixed(1).replace('.0', '').replace('.', ',')}K Ptw`;
  }
  // Montants < 1000 : on garde au plus une décimale, sans zéro inutile.
  const rounded = Math.round(ptw * 10) / 10;
  return `${rounded.toLocaleString('fr-FR')} Ptw`;
}

/**
 * Formate une valeur (en EUR) en chaîne Petaw abrégée.
 */
export function formatPtw(eur: number): string {
  return formatPtwAmount(toPtw(toFCFA(eur)));
}

/**
 * Formate une valeur FCFA brute (valeur interne) en chaîne Petaw abrégée.
 * Ex: 10_000 FCFA → "10 Ptw"  ·  18_500 FCFA → "18,5 Ptw"
 */
export function formatPtwRaw(fcfa: number): string {
  return formatPtwAmount(toPtw(fcfa));
}

// ===== Alias de compatibilité =====
// Conservés pour ne pas casser les imports existants. Affichent désormais des Petaw.
export const formatFCFA = formatPtw;
export const formatFCFARaw = formatPtwRaw;
