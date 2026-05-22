/**
 * AvatarPickerModal — grille de sélection d'un avatar prédéfini.
 *
 * Affiche les 12 avatars de `assets/images/avatars/` dans une grille.
 * Le choix est renvoyé via `onSelect` sous forme de valeur `avatar://avatarN`
 * (stockable directement dans `avatarUrl`).
 */
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { GamePopup, GAME_POPUP_WIDTH } from '@/components/ui/GamePopup';
import { GameButton } from '@/components/ui/GameButton';
import { PRESET_AVATARS, presetAvatarValue, isPresetAvatar, PRESET_AVATAR_SCHEME } from '@/config/avatars';

interface AvatarPickerModalProps {
  visible: boolean;
  /** Valeur `avatarUrl` actuelle — sert à présélectionner l'avatar courant. */
  currentValue?: string | null;
  /** True pendant l'enregistrement (désactive la validation). */
  isSaving?: boolean;
  onRequestClose: () => void;
  /** Reçoit la valeur `avatar://avatarN` choisie. */
  onSelect: (value: string) => void;
}

/** 3 avatars par ligne, marges incluses. */
const COLUMNS = 3;
const GRID_GAP = SPACING[3];
const CELL_SIZE =
  (GAME_POPUP_WIDTH - SPACING[5] * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

export function AvatarPickerModal({
  visible,
  currentValue,
  isSaving = false,
  onRequestClose,
  onSelect,
}: AvatarPickerModalProps) {
  // ID présélectionné : avatar courant s'il s'agit déjà d'un avatar prédéfini
  const initialId = isPresetAvatar(currentValue)
    ? currentValue!.slice(PRESET_AVATAR_SCHEME.length)
    : null;
  const [selectedId, setSelectedId] = useState<string | null>(initialId);

  const handleConfirm = () => {
    if (!selectedId) return;
    onSelect(presetAvatarValue(selectedId));
  };

  return (
    <GamePopup
      visible={visible}
      onRequestClose={onRequestClose}
      header="PERSONNALISE TON PROFIL"
      title="CHOISIS UN AVATAR"
      footer={
        <GameButton
          title="VALIDER"
          variant="yellow"
          fullWidth
          loading={isSaving}
          disabled={!selectedId || isSaving}
          onPress={handleConfirm}
        />
      }
    >
      <View style={styles.grid}>
        {PRESET_AVATARS.map((avatar) => {
          const isSelected = avatar.id === selectedId;
          return (
            <Pressable
              key={avatar.id}
              onPress={() => setSelectedId(avatar.id)}
              disabled={isSaving}
              style={[
                styles.cell,
                { width: CELL_SIZE, height: CELL_SIZE },
                isSelected && styles.cellSelected,
              ]}
            >
              <Image source={avatar.source} style={styles.avatarImage} resizeMode="cover" />
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color="#0C243E" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </GamePopup>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    justifyContent: 'center',
  },
  cell: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cellSelected: {
    borderColor: COLORS.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
