/**
 * Mes opportunités — écran dédié aux cartes sponsor sauvegardées en partie.
 *
 * POURQUOI UN ÉCRAN ET PLUS UNE SECTION DU PROFIL : la liste s'affichait
 * dépliée au milieu du profil, entre les blocs de stats. Elle grandissait avec
 * chaque sauvegarde et repoussait le reste, alors que c'est un contenu qu'on
 * vient consulter exprès — comme les succès ou les paramètres, qui ont chacun
 * leur écran. Le profil garde donc une simple entrée de menu.
 *
 * Un appui sur une ligne ouvre le lien de l'annonceur (et compte le clic) ;
 * la corbeille retire la ligne.
 */
import { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { DynamicGradientBorder, RadialBackground } from '@/components/ui';
import { useTranslation } from '@/i18n';
import {
  removeSavedOpportunity,
  subscribeToSavedOpportunities,
} from '@/services/firebase/savedOpportunityService';
import { trackSponsorCardClick } from '@/services/firebase/sponsorMetricsService';
import { useAuthStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { ouvrirLienExterne } from '@/utils/lienExterne';
import type { SavedSponsorOpportunity } from '@/types';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

export default function OpportunitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handleOpen = (item: SavedSponsorOpportunity) => {
    if (!item.linkUrl) return;
    // Un CLIC = une ouverture de lien, comptée à chaque fois (le joueur peut
    // légitimement revenir sur l'opportunité). Avant l'appel système, pour ne
    // rien perdre si l'app passe en arrière-plan.
    // `editionId` manque sur les items sauvegardés avant l'ajout des métriques :
    // leur clic n'est alors pas attribuable, donc pas compté.
    if (item.editionId) trackSponsorCardClick(item.editionId, item.id);
    void ouvrirLienExterne(item.linkUrl);
  };

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.savedOpportunitiesTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + SPACING[8],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          /*
            État vide EXPLICITE — la section du profil se contentait de
            disparaître quand la liste était vide. Ici l'écran existe toujours :
            sans ce bloc, l'entrée de menu ouvrirait une page blanche, et on ne
            saurait pas si c'est vide ou cassé.
          */
          <Animated.View entering={FadeInDown.duration(400)}>
            <DynamicGradientBorder borderRadius={20} fill="rgba(10, 25, 41, 0.6)" boxWidth={contentWidth}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="bookmark-outline" size={28} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>{t('profile.savedOpportunitiesEmptyTitle')}</Text>
                <Text style={styles.emptyBody}>{t('profile.savedOpportunitiesEmptyBody')}</Text>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)}>
            <DynamicGradientBorder borderRadius={20} fill="rgba(10, 25, 41, 0.6)" boxWidth={contentWidth}>
              <View style={styles.cardContent}>
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

                    <Text style={styles.rowText} numberOfLines={3}>
                      {item.text}
                    </Text>

                    <Ionicons
                      name="open-outline"
                      size={17}
                      color={COLORS.primary}
                      style={styles.openIcon}
                    />

                    <Pressable
                      onPress={() => userId && removeSavedOpportunity(userId, item.id)}
                      hitSlop={10}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  // width 100% obligatoire dans un DynamicGradientBorder (sinon rangées effondrées)
  cardContent: {
    width: '100%',
    padding: SPACING[4],
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: SPACING[2],
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
  emptyCard: {
    width: '100%',
    padding: SPACING[6],
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[3],
  },
  emptyTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
