/**
 * SavedOpportunitiesCard — section « Mes opportunités » du Profil.
 *
 * Liste les opportunités/financements SPONSOR sauvegardés en partie
 * (bouton « Sauvegarder » du SponsorEventPopup). Un clic sur une ligne
 * ouvre le lien externe du sponsor ; la corbeille retire la ligne.
 * Rendu null si invité ou liste vide.
 */
import { memo, useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DynamicGradientBorder } from '@/components/ui';
import { useTranslation } from '@/i18n';
import {
  removeSavedOpportunity,
  subscribeToSavedOpportunities,
} from '@/services/firebase/savedOpportunityService';
import { useAuthStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { SavedSponsorOpportunity } from '@/types';

interface SavedOpportunitiesCardProps {
  /** Largeur du bloc (boxWidth du DynamicGradientBorder). */
  width: number;
}

export const SavedOpportunitiesCard = memo(function SavedOpportunitiesCard({
  width,
}: SavedOpportunitiesCardProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<SavedSponsorOpportunity[]>([]);

  const userId = user && !user.isGuest ? user.id : null;

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    return subscribeToSavedOpportunities(userId, setItems);
  }, [userId]);

  if (!userId || items.length === 0) return null;

  const handleOpen = (item: SavedSponsorOpportunity) => {
    if (item.linkUrl) Linking.openURL(item.linkUrl).catch(() => undefined);
  };

  const handleRemove = (item: SavedSponsorOpportunity) => {
    removeSavedOpportunity(userId, item.id);
  };

  return (
    <View style={styles.section}>
      <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)" boxWidth={width}>
        <View style={styles.cardContent}>
          <Text style={styles.title}>{t('profile.savedOpportunitiesTitle')}</Text>
          <Text style={styles.subtitle}>{t('profile.savedOpportunitiesHint')}</Text>

          {items.map((item, index) => (
            <Pressable
              key={item.id}
              style={[styles.row, index < items.length - 1 && styles.rowBorder]}
              onPress={() => handleOpen(item)}
            >
              <View style={styles.logoWrap}>
                {item.logoUrl ? (
                  <Image source={{ uri: item.logoUrl }} style={styles.logo} resizeMode="contain" />
                ) : (
                  <Ionicons name="bookmark" size={18} color={COLORS.primary} />
                )}
              </View>

              <Text style={styles.rowText} numberOfLines={2}>
                {item.text}
              </Text>

              <Ionicons name="open-outline" size={17} color={COLORS.primary} style={styles.openIcon} />

              <Pressable onPress={() => handleRemove(item)} hitSlop={10} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={16} color="#94A3B8" />
              </Pressable>
            </Pressable>
          ))}
        </View>
      </DynamicGradientBorder>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING[4],
  },
  // width 100% obligatoire dans un DynamicGradientBorder (sinon rangées effondrées)
  cardContent: {
    width: '100%',
    padding: SPACING[4],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: SPACING[3],
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logoWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING[3],
    overflow: 'hidden',
  },
  logo: {
    width: 36,
    height: 36,
  },
  rowText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    lineHeight: 17,
    color: COLORS.white,
    marginRight: SPACING[2],
  },
  openIcon: {
    marginRight: SPACING[3],
  },
  removeBtn: {
    padding: 2,
  },
});
