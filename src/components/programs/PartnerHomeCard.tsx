import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DynamicGradientBorder, GameButton } from '@/components/ui';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import type { ProgramPartner } from '@/types/program';

interface PartnerHomeCardProps {
  partner: ProgramPartner;
  programCount: number;
  playerCount: number;
  onPress?: () => void;
}

export const PartnerHomeCard = memo(function PartnerHomeCard({
  partner,
  programCount,
  playerCount,
  onPress,
}: PartnerHomeCardProps) {
  const parcoursLabel = programCount > 1 ? 'parcours actifs' : 'parcours actif';

  const overlay = (
    <View style={styles.overlay}>
      <View style={styles.topRow}>
        <View style={styles.partnershipBlock}>
          <Text style={styles.partnershipText}>En partenariat avec</Text>
          {partner.logoUrl ? (
            <Image source={{ uri: partner.logoUrl }} style={styles.partnerLogo} resizeMode="contain" />
          ) : (
            <Text style={styles.partnerShortName}>{partner.shortName}</Text>
          )}
        </View>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>{programCount} {parcoursLabel}</Text>
        </View>
      </View>

      <View style={styles.centerBlock}>
        <Text style={styles.partnerTitle} numberOfLines={2}>{partner.name}</Text>
        <View style={styles.playerBadge}>
          <Ionicons name="people" size={15} color={COLORS.primary} />
          <Text style={styles.playerBadgeText}>{playerCount.toLocaleString()} joueurs</Text>
        </View>
      </View>

      <GameButton
        title="PARTICIPER"
        variant="yellow"
        fullWidth
        onPress={onPress}
      />
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(450)}>
      <Pressable onPress={onPress}>
        <DynamicGradientBorder borderRadius={24} fill="rgba(10, 25, 41, 0.65)">
          {partner.bannerUrl ? (
            <ImageBackground
              source={{ uri: partner.bannerUrl }}
              style={styles.bannerWrap}
              imageStyle={styles.bannerImage}
              resizeMode="cover"
            >
              <View style={styles.scrim} />
              {overlay}
            </ImageBackground>
          ) : (
            <View style={[styles.bannerWrap, { backgroundColor: partner.primaryColor }]}>
              {overlay}
            </View>
          )}
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  bannerWrap: {
    width: '100%',
    minHeight: 300,
    borderRadius: 24,
    overflow: 'hidden',
  },
  bannerImage: {
    borderRadius: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 41, 0.25)',
  },
  overlay: {
    flex: 1,
    padding: SPACING[4],
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  partnershipBlock: {
    gap: 6,
  },
  partnershipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  partnerLogo: {
    width: 84,
    height: 52,
  },
  partnerShortName: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.info,
  },
  activeBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#132840',
  },
  centerBlock: {
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[3],
  },
  partnerTitle: {
    fontFamily: FONTS.title,
    fontSize: 28,
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  playerBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: '#132840',
  },
});
