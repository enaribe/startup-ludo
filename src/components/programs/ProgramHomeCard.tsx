import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DynamicGradientBorder, GameButton } from '@/components/ui';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import type { PartnerProgram, ProgramEnrollment, ProgramPartner, ProgramPlayAccess } from '@/types/program';

interface ProgramHomeCardProps {
  program: PartnerProgram;
  partner?: ProgramPartner | null;
  coPartners?: ProgramPartner[];
  enrollment?: ProgramEnrollment | null;
  access?: ProgramPlayAccess | null;
  onPress?: () => void;
  onPlay?: () => void;
}

export const ProgramHomeCard = memo(function ProgramHomeCard({
  program,
  partner,
  coPartners = [],
  enrollment,
  access,
  onPress,
  onPlay,
}: ProgramHomeCardProps) {
  const actionLabel = enrollment?.formData
    ? 'CONTINUER'
    : access?.reason === 'trial_used'
      ? "S'INSCRIRE"
      : 'JOUER';

  const backgroundUrl = program.heroImageUrl || program.bannerUrl;
  const allPartners = partner ? [partner, ...coPartners] : coPartners;
  const partnerNames = allPartners.map((item) => item.name).join(' · ');

  const bannerOverlay = (
    <View style={styles.bannerOverlay}>
      <View style={styles.bannerTopRow}>
        <View style={styles.partnershipBlock}>
          <Text style={styles.partnershipText}>En partenariat avec</Text>
          <View style={styles.partnerLogosRow}>
            {allPartners.map((item) =>
              item.logoUrl ? (
                <Image key={item.id} source={{ uri: item.logoUrl }} style={styles.partnerLogo} resizeMode="contain" />
              ) : (
                <Text key={item.id} style={styles.partnerShortName}>{item.shortName}</Text>
              )
            )}
          </View>
        </View>
        {program.logoUrl ? (
          <View style={styles.programLogoBadge}>
            <Image source={{ uri: program.logoUrl }} style={styles.programLogo} resizeMode="contain" />
          </View>
        ) : null}
      </View>

      <View style={styles.playerBadge}>
        <Ionicons name="people" size={15} color={COLORS.info} />
        <Text style={styles.playerBadgeText}>{program.playerCount.toLocaleString()} joueurs</Text>
      </View>
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(450)}>
      <Pressable onPress={onPress}>
        <DynamicGradientBorder borderRadius={24} fill="rgba(10, 25, 41, 0.65)">
          <View style={styles.bannerWrap}>
            {backgroundUrl ? (
              <ImageBackground
                source={{ uri: backgroundUrl }}
                style={styles.banner}
                imageStyle={styles.bannerImage}
                resizeMode="cover"
              >
                <View style={styles.scrim} />
                {bannerOverlay}
              </ImageBackground>
            ) : (
              <View style={[styles.banner, { backgroundColor: program.primaryColor }]}>
                {bannerOverlay}
                <Text style={styles.bannerTitle}>{program.name}</Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            <Text style={styles.partnerName}>{partnerNames || 'Partenaire'}</Text>
            <Text style={styles.programName} numberOfLines={2}>{program.name}</Text>
            <Text style={styles.description} numberOfLines={2}>{program.description}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="game-controller-outline" size={13} color={COLORS.primary} />
                <Text style={styles.metaText}>{program.sessionCount} parties</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="briefcase-outline" size={13} color={COLORS.primary} />
                <Text style={styles.metaText}>{program.audience.sector}</Text>
              </View>
            </View>

            <GameButton
              title={actionLabel}
              variant="yellow"
              fullWidth
              onPress={onPlay ?? onPress}
            />
          </View>
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  bannerWrap: {
    position: 'relative',
    width: '100%',
  },
  banner: {
    width: '100%',
    aspectRatio: 355 / 185,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  bannerImage: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 41, 0.22)',
  },
  bannerOverlay: {
    flex: 1,
    padding: SPACING[4],
    justifyContent: 'space-between',
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  partnershipBlock: {
    gap: 4,
    flexShrink: 1,
  },
  partnershipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  partnerLogosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partnerLogo: {
    width: 62,
    height: 36,
  },
  partnerShortName: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  programLogoBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programLogo: {
    width: 40,
    height: 40,
  },
  bannerTitle: {
    position: 'absolute',
    left: SPACING[4],
    bottom: SPACING[4],
    maxWidth: '60%',
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.white,
  },
  playerBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playerBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#132840',
  },
  content: {
    padding: SPACING[4],
    gap: SPACING[2],
  },
  partnerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  programName: {
    fontFamily: FONTS.title,
    fontSize: 21,
    color: COLORS.white,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.white,
  },
});
