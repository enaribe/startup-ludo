/**
 * SponsorEventPopup — Carte SPONSOR tirée en partie (édition sponsorisée).
 *
 * Design fourni (maquette) : même habillage vert que les opportunités
 * (header ampoule + dés) pour les deux types (OPPORTUNITÉ / FINANCEMENT),
 * avec le logo du sponsor au-dessus du texte dans le panneau clair,
 * badge « +N » jetons et bouton CONTINUER.
 */

import { memo, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { GameButton } from '@/components/ui/GameButton';
import { Modal } from '@/components/ui/Modal';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import { useTranslation } from '@/i18n';
import { saveSponsorOpportunity } from '@/services/firebase/savedOpportunityService';
import { useAuthStore } from '@/stores';
import type { SavedSponsorOpportunity } from '@/types';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { OpportunityHeader } from './OpportunityHeader';

interface SponsorEventPopupProps {
  visible: boolean;
  /** Libellé du header : OPPORTUNITÉ ou FINANCEMENT. */
  label: string;
  /** Texte de la carte sponsor. */
  description: string;
  /** Jetons gagnés (badge « +N »). */
  value: number;
  /** Logo du sponsor affiché au-dessus du texte. */
  logoUrl?: string;
  /** Texte du bandeau spectateur (adversaire/IA joue). */
  spectatorText?: string;
  /**
   * Payload du bouton « Sauvegarder » (carte avec lien externe) — le joueur
   * la retrouve dans son Profil après la partie. Absent si la carte n'a pas de lien.
   */
  savePayload?: Omit<SavedSponsorOpportunity, 'savedAt'>;
  onAccept: () => void;
  onClose: () => void;
  isSpectator?: boolean;
  onSpectatorClose?: () => void;
}

export const SponsorEventPopup = memo(function SponsorEventPopup({
  visible,
  label,
  description,
  value,
  logoUrl,
  spectatorText,
  savePayload,
  onAccept,
  onClose,
  isSpectator = false,
  onSpectatorClose,
}: SponsorEventPopupProps) {
  const { t } = useTranslation();
  usePlaySoundOnOpen(visible, 'popup-open');

  const user = useAuthStore((state) => state.user);
  const canSave = !!savePayload && !!user && !user.isGuest;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Nouvelle carte affichée → réinitialise l'état du bouton Sauvegarder
  useEffect(() => {
    if (visible) {
      setSaved(false);
      setSaving(false);
    }
  }, [visible, savePayload?.id]);

  const handleSave = async () => {
    if (!canSave || !savePayload || saved || saving) return;
    setSaving(true);
    try {
      await saveSponsorOpportunity(user.id, { ...savePayload, savedAt: Date.now() });
      setSaved(true);
    } catch {
      // Offline / erreur réseau : le joueur peut réessayer
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={FadeIn.duration(220)} style={styles.card}>
        <OpportunityHeader label={label} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {isSpectator && spectatorText && (
            <View style={styles.spectatorBanner}>
              <Ionicons name="eye" size={14} color={COLORS.white} />
              <Text style={styles.spectatorText}>{spectatorText}</Text>
            </View>
          )}

          {/* Panneau clair : logo sponsor + texte */}
          <View style={styles.descriptionBox}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.sponsorLogo} resizeMode="contain" />
            ) : null}
            <Text style={styles.description}>{description}</Text>
          </View>

          {/* Badge gain */}
          <Animated.View entering={FadeInDown.delay(200).duration(250)} style={styles.gainRow}>
            <View style={styles.badge}>
              <OutlinedText
                text={`+${value}`}
                style={styles.badgeText}
                outlineColor="#2E7D32"
                outlineWidth={2}
              />
            </View>
          </Animated.View>

          {/* Bouton SAUVEGARDER — le joueur retrouve l'opportunité dans son Profil */}
          {canSave && (
            <Animated.View entering={FadeInDown.delay(300).duration(220)} style={styles.saveWrap}>
              <Pressable
                onPress={handleSave}
                disabled={saved || saving}
                style={[styles.saveButton, saved && styles.saveButtonSaved]}
                hitSlop={6}
              >
                <Ionicons
                  name={saved ? 'checkmark-circle' : 'bookmark-outline'}
                  size={17}
                  color={saved ? '#2E7D32' : COLORS.info}
                />
                <Text style={[styles.saveText, saved && styles.saveTextSaved]}>
                  {saved ? t('sponsorEvent.saved') : t('sponsorEvent.save')}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Bouton CONTINUER */}
          {!isSpectator && (
            <Animated.View entering={FadeInDown.delay(400).duration(220)} style={styles.buttonWrap}>
              <GameButton
                title={t('eventPopup.continue')}
                onPress={onAccept}
                variant="green"
                fullWidth
              />
            </Animated.View>
          )}

          {/* Bouton FERMER en mode spectateur (IA joue) */}
          {isSpectator && onSpectatorClose && (
            <Animated.View entering={FadeInDown.delay(300).duration(220)} style={styles.buttonWrap}>
              <GameButton title={t('eventPopup.close')} onPress={onSpectatorClose} variant="blue" fullWidth />
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    maxWidth: 360,
    width: '92%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[4],
    width: '100%',
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    textAlign: 'center',
  },
  descriptionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[4],
    alignItems: 'center',
  },
  sponsorLogo: {
    width: '70%',
    height: 56,
    marginBottom: SPACING[3],
  },
  description: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
  },
  gainRow: {
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING[4],
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    backgroundColor: COLORS.success,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  badgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  buttonWrap: {
    width: '100%',
  },
  saveWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.info,
    backgroundColor: 'rgba(33, 150, 243, 0.06)',
  },
  saveButtonSaved: {
    borderColor: '#2E7D32',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  saveText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
  },
  saveTextSaved: {
    color: '#2E7D32',
  },
});
