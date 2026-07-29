/**
 * Utilitaires de comparaison de versions sémantiques ("2.2.0", "2.10.1", …).
 */

/** Découpe "2.2.0" en [2, 2, 0]. Les segments non numériques valent 0. */
function parseVersion(version: string): number[] {
  return version
    .trim()
    .split('.')
    .map((seg) => {
      const n = parseInt(seg, 10);
      return Number.isFinite(n) ? n : 0;
    });
}

/**
 * Compare deux versions : négatif si a < b, 0 si égales, positif si a > b.
 * Ex : compareVersions('2.2.0', '2.3.0') < 0
 */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  const len = Math.max(va.length, vb.length);
  for (let i = 0; i < len; i++) {
    const diff = (va[i] ?? 0) - (vb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** true si `current` est strictement inférieure à `minimum`. */
export function isVersionBelow(current: string, minimum: string): boolean {
  return compareVersions(current, minimum) < 0;
}
