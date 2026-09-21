/**
 * RegionPromptPopup — déclaration de la région du joueur (Espace Annonceur, lot 2).
 *
 * POURQUOI DÉCLARATIF : le besoin est grossier (14 régions + diaspora), des
 * mineurs jouent (Mode Classe), et une déclaration marche hors-ligne, sans
 * permission système. Décision produit actée au plan Espace Annonceur (§3) —
 * aucune géolocalisation, nulle part.
 *
 * DEUX USAGES, un seul composant :
 *   - rattrapage sur l'accueil : profils sans `region` (nouveaux inscrits
 *     compris — le popup apparaît dès leur première arrivée), avec « Plus
 *     tard » qui snooze 24 h ;
 *   - modification depuis le profil : ouvert avec la région courante
 *     présélectionnée, sans « Plus tard » (on est venu exprès).
 *
 * La sauvegarde passe par `updateFirestoreUserProfile` (users/{uid}, champ
 * auto-déclaré donc écrivable par son propriétaire) PUIS par le store local —
 * l'attribution des métriques sponsor lit le store, elle est à jour dès la
 * fermeture du popup.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { GameButton, GamePopup } from '@/components/ui';
import { PLAYER_REGIONS } from '@/data/regions';
import { useTranslation } from '@/i18n';
import { updateFirestoreUserProfile } from '@/services/firebase';
import { useAuthStore, useSettingsStore, useUserStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

export default function RegionPromptPopup({
  visible,
  onClose,
  allowLater = true,
}: {
  visible: boolean;
  onClose: () => void;
  /** Affiche « Plus tard » (rattrapage) — masqué en mode modification. */
  allowLater?: boolean;
}) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const dismissRegionPrompt = useSettingsStore((s) => s.dismissRegionPrompt);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const [choix, setChoix] = useState<string | null>(profile?.region ?? null);
  const [enregistrement, setEnregistrement] = useState(false);

  const confirmer = async () => {
    if (!choix || !user?.id || enregistrement) return;
    setEnregistrement(true);
    if (hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateFirestoreUserProfile(user.id, { region: choix });
      await updateProfile({ region: choix });
      onClose();
    } catch {
      // Hors ligne ou refus : on ferme sans dramatiser — le popup se
      // représentera tant que la région n'est pas enregistrée.
      onClose();
    } finally {
      setEnregistrement(false);
    }
  };

  const plusTard = () => {
    dismissRegionPrompt();
    onClose();
  };

  return (
    <GamePopup
      visible={visible}
      onRequestClose={allowLater ? plusTard : onClose}
      header={t('region.header')}
      title={t('region.title')}
      footer={
        <>
          <GameButton
            variant="yellow"
            fullWidth
            title={t('region.confirm')}
            onPress={() => void confirmer()}
            loading={enregistrement}
            disabled={!choix || enregistrement}
            style={styles.confirmBtn}
          />
          {allowLater && (
            <Pressable onPress={plusTard} hitSlop={8}>
              <Text style={styles.laterText}>{t('region.later')}</Text>
            </Pressable>
          )}
        </>
      }
    >
      <Text style={styles.body}>{t('region.body')}</Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {PLAYER_REGIONS.map((region) => {
          const actif = choix === region.id;
          return (
            <Pressable
              key={region.id}
              onPress={() => setChoix(region.id)}
              style={[styles.row, actif && styles.rowActive]}
            >
              <Text style={[styles.rowLabel, actif && styles.rowLabelActive]} numberOfLines={1}>
                {region.label}
              </Text>
              {actif && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
            </Pressable>
          );
        })}
      </ScrollView>
    </GamePopup>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[3],
    paddingHorizontal: SPACING[2],
  },
  list: {
    maxHeight: 300,
    marginBottom: SPACING[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  rowLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
    flexShrink: 1,
  },
  rowLabelActive: {
    color: '#FFFFFF',
  },
  confirmBtn: {
    marginBottom: SPACING[3],
  },
  laterText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    paddingVertical: SPACING[1],
  },
});
