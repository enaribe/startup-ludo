/**
 * PopupHeader — En-tête SVG générique pour les popups du jeu plateau
 *
 * USAGE :
 * ───────
 * <PopupHeader
 *   color="#1F91D0"         // couleur principale du fond
 *   icon={<QuizIconPaths />}  // paths SVG de l'icône gauche (rendu dans <Defs> + canvas)
 *   label={<QuizLabelPaths />} // paths SVG du texte (fill white + couche mask)
 *   decorRight={<DiamondAndDice />} // icônes déco droite (optionnel)
 * />
 *
 * STRUCTURE DU SVG (viewBox 0 0 356 83) :
 * ─────────────────────────────────────────
 * 1. Fond arrondi en haut (borderRadius 20 haut gauche/droite) — couleur prop
 * 2. Overlay dégradé linéaire blanc (opacity 0.2)
 * 3. Overlay dégradé radial blanc (opacity 0.2)
 * 4. Décoration étoile à gauche (opacity 0.03, toujours la même)
 * 5. Icône gauche : rendue via prop `icon`
 * 6. Texte titre : rendu via prop `label`
 * 7. Déco droite : rendue via prop `decorRight` (optionnel)
 */

import React from 'react';
import Svg, { Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

interface PopupHeaderProps {
  /** Couleur principale du fond (ex: "#1F91D0") */
  color: string;
  /**
   * Fill SVG alternatif pour le fond (ex: "url(#mon_gradient)").
   * Si fourni, remplace `color` pour le remplissage du fond.
   * Le gradient correspondant doit être injecté via `iconDefs`.
   */
  colorFill?: string;
  /**
   * Icône gauche — ReactNode SVG à placer dans le canvas.
   * Doit être des éléments react-native-svg (Path, G, etc.)
   * positionnés dans le viewBox 0 0 356 83.
   * Les <Defs> propres à l'icône (LinearGradient, etc.) doivent
   * être passés via `iconDefs`.
   */
  icon: React.ReactNode;
  /**
   * Defs SVG propres à l'icône (LinearGradient, RadialGradient, Mask…)
   * Ils seront injectés dans le bloc <Defs> global du SVG.
   */
  iconDefs?: React.ReactNode;
  /**
   * Texte/label du popup — ReactNode SVG (Path fill white + Path mask contour).
   * Doit inclure ses propres <Defs> (Mask) via `labelDefs`.
   */
  label: React.ReactNode;
  /** Defs SVG du label (Mask pour le contour du texte) */
  labelDefs?: React.ReactNode;
  /**
   * Décorations droite optionnelles (icônes en bas à droite).
   * ReactNode SVG positionné dans le viewBox.
   */
  decorRight?: React.ReactNode;
}

export function PopupHeader({
  color,
  colorFill,
  icon,
  iconDefs,
  label,
  labelDefs,
  decorRight,
}: PopupHeaderProps) {
  return (
    <Svg width="100%" height={83} viewBox="0 0 356 83" preserveAspectRatio="xMidYMid slice">
      <Defs>
        {/* Overlay linéaire blanc (fixe) */}
        <LinearGradient id="ph_paint0_linear" x1="178.5" y1="9.0527e-06" x2="178.5" y2="83" gradientUnits="userSpaceOnUse">
          <Stop stopColor="white" />
          <Stop offset="1" stopColor="white" stopOpacity="0" />
        </LinearGradient>
        {/* Overlay radial blanc (fixe) */}
        <RadialGradient id="ph_paint1_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(178.5 14.4837) rotate(90) scale(68.5163 177.5)">
          <Stop stopColor="white" />
          <Stop offset="1" stopColor="white" stopOpacity="0" />
        </RadialGradient>
        {/* Étoile déco (fixe) */}
        <RadialGradient id="ph_paint2_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(43.999 41.4995) rotate(90) scale(41.4995 44.835)">
          <Stop offset="0.075" stopColor="white" stopOpacity="0" />
          <Stop offset="0.34" stopColor="white" />
          <Stop offset="0.861842" stopColor="white" stopOpacity="0.01" />
        </RadialGradient>

        {/* Defs propres à l'icône (injectés par le parent) */}
        {iconDefs}

        {/* Defs propres au label (Mask, etc.) */}
        {labelDefs}
      </Defs>

      {/* 1. Fond arrondi en haut */}
      <Path
        d="M0 20C0 8.95431 8.95431 0 20 0H336C347.046 0 356 8.95431 356 20V83H0V20Z"
        fill={colorFill ?? color}
      />
      {/* 2. Overlay dégradé linéaire blanc */}
      <Path
        d="M1 20C1 8.95431 9.9543 0 21 0H336C347.046 0 356 8.95431 356 20V83H1V20Z"
        fill="url(#ph_paint0_linear)"
        fillOpacity="0.2"
      />
      {/* 3. Overlay dégradé radial blanc */}
      <Path
        d="M1 20C1 8.95431 9.9543 0 21 0H336C347.046 0 356 8.95431 356 20V83H1V20Z"
        fill="url(#ph_paint1_radial)"
        fillOpacity="0.2"
      />

      {/* 4. Décoration étoile (fixe, très subtile) */}
      <G opacity="0.03">
        <Path
          d="M43.9912 41.4961L43.999 41.499H43.998L44.001 41.5107L83.6289 63.5186L67.7773 78.1924L44.002 41.5146L55.207 82.999H32.79L43.9902 41.5254L20.2217 78.1953L4.37012 63.5225L43.9932 41.5156L43.9951 41.5049L43.9863 41.501L-0.835938 51.875V31.124L43.9697 41.4912L4.36914 19.499L20.2207 4.8252L43.9912 41.4961ZM44.0029 41.4873L67.7764 4.81348L83.6279 19.4863L44.002 41.4932L44 41.499L88.834 31.125V51.876L44 41.5V41.502L32.791 0H55.208L44.0029 41.4873ZM43.9932 41.499L43.9951 41.5029L43.9971 41.499H43.9932Z"
          fill="url(#ph_paint2_radial)"
        />
      </G>

      {/* 5. Icône gauche (variable) */}
      {icon}

      {/* 6. Label/titre (variable) */}
      {label}

      {/* 7. Décos droite (optionnelles) */}
      {decorRight}
    </Svg>
  );
}
