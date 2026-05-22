import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface AfkCountdownBorderProps {
  /** Secondes restantes (15..0). */
  secondsLeft: number;
  /** Durée totale du décompte, pour calculer la proportion. */
  totalSeconds: number;
  /** Largeur de la carte (mesurée via onLayout). */
  width: number;
  /** Hauteur de la carte (mesurée via onLayout). */
  height: number;
  /** Rayon des coins de la carte. */
  borderRadius: number;
  /** Couleur du trait — la couleur du joueur (ne change jamais). */
  color: string;
  /** Épaisseur du trait — identique à la bordure de la carte. */
  strokeWidth: number;
}

/**
 * Remplace la bordure de la PlayerCard pendant le décompte anti-AFK :
 * c'est le même trait (même couleur joueur, même épaisseur) qui se décharge
 * progressivement sur le périmètre. Aucun trait supplémentaire, aucune
 * couleur qui change.
 */
export const AfkCountdownBorder = memo(function AfkCountdownBorder({
  secondsLeft,
  totalSeconds,
  width,
  height,
  borderRadius,
  color,
  strokeWidth,
}: AfkCountdownBorderProps) {
  if (width <= 0 || height <= 0) return null;

  const inset = strokeWidth / 2;
  const rectW = width - strokeWidth;
  const rectH = height - strokeWidth;
  const r = Math.max(0, borderRadius - inset);

  // Périmètre approximatif d'un rectangle à coins arrondis.
  const perimeter = 2 * (rectW + rectH) - 8 * r + 2 * Math.PI * r;

  const ratio = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const dashOffset = perimeter * (1 - ratio);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Rect
          x={inset}
          y={inset}
          width={rectW}
          height={rectH}
          rx={r}
          ry={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${perimeter} ${perimeter}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
    </View>
  );
});
