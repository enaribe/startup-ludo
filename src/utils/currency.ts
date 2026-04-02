/**
 * currency.ts — Utilitaire d'affichage monétaire en FCFA
 *
 * Taux de conversion officiel EUR → FCFA : 1€ = 655,957 XOF (CFA Franc BCEAO)
 * Les valeurs stockées sont en EUR, on convertit uniquement à l'affichage.
 */

export const EUR_TO_FCFA = 655.957;

/**
 * Convertit une valeur EUR en FCFA.
 */
export function toFCFA(eur: number): number {
  return Math.round(eur * EUR_TO_FCFA);
}

/**
 * Formate une valeur (en EUR) en chaîne FCFA abrégée.
 * Ex: 2000000 → "1,3Md FCFA"  (milliards)
 *     1200    → "787K FCFA"
 *     500     → "328 000 FCFA"
 */
export function formatFCFA(eur: number): string {
  const fcfa = toFCFA(eur);

  if (fcfa >= 1_000_000_000) {
    return `${(fcfa / 1_000_000_000).toFixed(1).replace('.0', '')}Md FCFA`;
  }
  if (fcfa >= 1_000_000) {
    return `${(fcfa / 1_000_000).toFixed(1).replace('.0', '')}M FCFA`;
  }
  if (fcfa >= 1_000) {
    return `${Math.round(fcfa / 1_000)}K FCFA`;
  }
  return `${fcfa.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Formate une valeur FCFA brute (déjà convertie) en chaîne abrégée.
 * Utile quand la valeur est déjà en FCFA.
 */
export function formatFCFARaw(fcfa: number): string {
  if (fcfa >= 1_000_000_000) {
    return `${(fcfa / 1_000_000_000).toFixed(1).replace('.0', '')}Md FCFA`;
  }
  if (fcfa >= 1_000_000) {
    return `${(fcfa / 1_000_000).toFixed(1).replace('.0', '')}M FCFA`;
  }
  if (fcfa >= 1_000) {
    return `${Math.round(fcfa / 1_000)}K FCFA`;
  }
  return `${fcfa.toLocaleString('fr-FR')} FCFA`;
}
