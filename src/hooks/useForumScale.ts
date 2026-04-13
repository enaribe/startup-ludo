/**
 * useForumScale — Facteur d'échelle pour le mode forum (totem vertical).
 *
 * Un totem portrait typique fait ~1080×1920 px (10-13").
 * Ce hook calcule un `scale` (1.0 → 1.8) basé sur la largeur réelle,
 * et expose des helpers pré-calculés pour polices, espacements et tailles d'icônes.
 *
 * N'affecte que les écrans (forum). Ne modifie pas typography.ts ni spacing.ts.
 */

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

// Référence de base : iPhone 390px de large
const BASE_WIDTH = 390;

// Totem visé : ~1080px. Scale max plafonné pour éviter les excès.
const MAX_SCALE = 1.75;

export interface ForumScale {
  /** Facteur d'échelle brut (ex: 1.0 sur téléphone, ~1.55 sur totem 1080px) */
  scale: number;
  /** true si l'écran est considéré comme grand (>= 600px) */
  isLarge: boolean;
  /** Adapte un fontSize fixe (base mobile) au facteur d'échelle */
  fs: (base: number) => number;
  /** Adapte un spacing / dimension fixe */
  sp: (base: number) => number;
  /** Largeur de contenu (avec marges latérales sécurisées) */
  contentWidth: number;
  /** Padding horizontal de la page */
  hPad: number;
  /** Dimensions pré-calculées courantes */
  sizes: {
    avatarSm: number;     // cercle avatar petit
    avatarMd: number;     // cercle avatar moyen
    badgeSm: number;      // badge rang petit
    badgeMd: number;      // badge rang moyen
    iconSm: number;       // icône inline
    iconMd: number;       // icône action
    headerBtn: number;    // bouton header
    logoH: number;        // hauteur logo
    logoW: number;        // largeur logo
    inputPadV: number;    // padding vertical input
    inputPadH: number;    // padding horizontal input
    borderRadius: number; // rayon carte principale
    trophyW: number;      // trophée résultats
    tokenDot: number;     // pastille jeton
  };
}

export function useForumScale(): ForumScale {
  const { width, height: _height } = useWindowDimensions();

  return useMemo(() => {
    const raw = width / BASE_WIDTH;
    const scale = Math.min(raw, MAX_SCALE);
    const isLarge = width >= 600;

    const hPad = Math.round(Math.min(32, width * 0.04) * scale);
    const contentWidth = width - hPad * 2;

    const fs = (base: number) => Math.round(base * scale);
    const sp = (base: number) => Math.round(base * scale);

    return {
      scale,
      isLarge,
      fs,
      sp,
      contentWidth,
      hPad,
      sizes: {
        avatarSm:    sp(32),
        avatarMd:    sp(44),
        badgeSm:     sp(32),
        badgeMd:     sp(44),
        iconSm:      sp(18),
        iconMd:      sp(24),
        headerBtn:   sp(44),
        logoH:       sp(48),
        logoW:       sp(160),
        inputPadV:   sp(16),
        inputPadH:   sp(16),
        borderRadius: sp(20),
        trophyW:     Math.min(sp(100), contentWidth * 0.28),
        tokenDot:    sp(16),
      },
    };
  }, [width]);
}
