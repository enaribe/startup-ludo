/**
 * Catalogue des avatars prédéfinis (assets/images/avatars/).
 *
 * Un avatar prédéfini est stocké dans `avatarUrl` sous la forme `avatar://avatarN`.
 * Ce schéma permet de distinguer un avatar local d'une vraie URL d'image
 * (photo perso uploadée sur Firebase Storage) — voir le composant `Avatar`.
 */
import type { ImageSourcePropType } from 'react-native';

/** Préfixe identifiant un avatar prédéfini dans `avatarUrl`. */
export const PRESET_AVATAR_SCHEME = 'avatar://';

export interface PresetAvatar {
  /** Identifiant stable, ex. "avatar3". Stocké tel quel (préfixé). */
  id: string;
  /** Source d'image pour <Image source={...} />. */
  source: ImageSourcePropType;
}

/** Les 12 avatars disponibles. L'ordre définit l'affichage dans la grille. */
export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'avatar1', source: require('@/../assets/images/avatars/avatar1.png') },
  { id: 'avatar2', source: require('@/../assets/images/avatars/avatar2.png') },
  { id: 'avatar3', source: require('@/../assets/images/avatars/avatar3.png') },
  { id: 'avatar4', source: require('@/../assets/images/avatars/avatar4.png') },
  { id: 'avatar5', source: require('@/../assets/images/avatars/avatar5.png') },
  { id: 'avatar6', source: require('@/../assets/images/avatars/avatar6.png') },
  { id: 'avatar7', source: require('@/../assets/images/avatars/avatar7.png') },
  { id: 'avatar8', source: require('@/../assets/images/avatars/avatar8.png') },
  { id: 'avatar9', source: require('@/../assets/images/avatars/avatar9.png') },
  { id: 'avatar10', source: require('@/../assets/images/avatars/avatar10.png') },
  { id: 'avatar11', source: require('@/../assets/images/avatars/avatar11.png') },
  { id: 'avatar12', source: require('@/../assets/images/avatars/avatar12.png') },
];

/** Valeur à stocker dans `avatarUrl` pour un avatar prédéfini donné. */
export function presetAvatarValue(id: string): string {
  return `${PRESET_AVATAR_SCHEME}${id}`;
}

/** True si la valeur `avatarUrl` désigne un avatar prédéfini local. */
export function isPresetAvatar(value: string | null | undefined): boolean {
  return !!value && value.startsWith(PRESET_AVATAR_SCHEME);
}

/**
 * Résout une valeur `avatarUrl` en source d'image utilisable.
 * - `avatar://avatarN` → require local de l'asset
 * - URL http(s) → `{ uri }`
 * - inconnu / null → null
 */
export function resolveAvatarSource(
  value: string | null | undefined
): ImageSourcePropType | null {
  if (!value) return null;
  if (isPresetAvatar(value)) {
    const id = value.slice(PRESET_AVATAR_SCHEME.length);
    return PRESET_AVATARS.find((a) => a.id === id)?.source ?? null;
  }
  return { uri: value };
}
