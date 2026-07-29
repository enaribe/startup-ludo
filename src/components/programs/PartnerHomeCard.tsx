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
  playerCount: number;
  onPress?: () => void;
}

export const PartnerHomeCard = memo(function PartnerHomeCard({
  partner,
  playerCount,
  onPress,
}: PartnerHomeCardProps) {
  const overlay = (
    <View style={styles.overlay}>
      <View style={styles.topRow}>
        <View style={styles.secondaryLogoBlock}>
          {partner.secondaryLogoUrl ? (
            <Image source={{ uri: partner.secondaryLogoUrl }} style={styles.secondaryLogo} resizeMode="contain" />
          ) : null}
        </View>
        <View style={styles.partnershipBlock}>
          {partner.logoUrl ? (
            <Image source={{ uri: partner.logoUrl }} style={styles.partnerLogo} resizeMode="contain" />
          ) : (
            <Text style={styles.partnerShortName}>{partner.shortName}</Text>
          )}
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
    alignItems: 'center',
  },
  secondaryLogoBlock: {
    alignItems: 'flex-start',
  },
  secondaryLogo: {
    width: 84,
    height: 52,
  },
  partnershipBlock: {
    gap: 6,
    alignItems: 'flex-end',
  },
  partnerLogo: {
    width: 60,
    height: 38,
  },
  partnerShortName: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
