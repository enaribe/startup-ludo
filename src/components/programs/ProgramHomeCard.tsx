import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AutoWidthLogo } from '@/components/programs/AutoWidthLogo';
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

  const backgroundUrl = program.heroImageUrl;

  // Logos co-partenaires « En partenariat avec » : d'abord celui uploadé sur le programme,
  // puis les logos des partenaires cochés comme co-partenaires.
  const coPartnerLogos = [
    ...(program.bannerUrl ? [program.bannerUrl] : []),
    ...coPartners.map((item) => item.logoUrl).filter((url): url is string => Boolean(url)),
  ];

  const cardInner = (
    <View style={styles.overlay}>
      {/* Haut : co-partenaire(s) à gauche, partenaire principal à droite, sur la même ligne */}
      <View style={styles.topRow}>
        {coPartnerLogos.length > 0 ? (
          <View style={styles.coPartnerLogosRow}>
            {coPartnerLogos.map((logo, i) => (
              <AutoWidthLogo key={i} uri={logo} height={28} />
            ))}
          </View>
        ) : (
          <View />
        )}

        {partner?.logoUrl ? (
          <AutoWidthLogo uri={partner.logoUrl} height={46} />
        ) : partner ? (
          <Text style={styles.partnerShortName}>{partner.shortName}</Text>
        ) : (
          <View />
        )}
      </View>

      {/* Milieu-gauche : logo du programme + badge joueurs, regroupés et proches */}
      <View style={styles.middleRow}>
        {program.logoUrl ? (
          <Image source={{ uri: program.logoUrl }} style={styles.programLogo} resizeMode="contain" />
        ) : (
          <Text style={styles.programNameFallback} numberOfLines={2}>{program.name}</Text>
        )}

        <View style={styles.playerBadge}>
          <Ionicons name="people" size={15} color={COLORS.info} />
          <Text style={styles.playerBadgeText}>{program.playerCount.toLocaleString()} joueurs</Text>
        </View>
      </View>

      {/* Bas : bouton JOUER */}
      <View style={styles.bottomBlock}>
        <GameButton
          title={actionLabel}
          variant="yellow"
          fullWidth
          onPress={onPlay ?? onPress}
        />
      </View>
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(450)}>
      <Pressable onPress={onPress}>
        <DynamicGradientBorder borderRadius={24} fill="rgba(10, 25, 41, 0.65)">
          {backgroundUrl ? (
            <ImageBackground
              source={{ uri: backgroundUrl }}
              style={styles.card}
              imageStyle={styles.cardImage}
              resizeMode="cover"
            >
              <View style={styles.scrim} />
              {cardInner}
            </ImageBackground>
          ) : (
            <View style={[styles.card, { backgroundColor: program.primaryColor }]}>
              {cardInner}
            </View>
          )}
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 340 / 240,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardImage: {
    borderRadius: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
  coPartnerLogosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerShortName: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  middleRow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: SPACING[2],
  },
  programLogo: {
    width: 160,
    height: 70,
    alignSelf: 'flex-start',
  },
  programNameFallback: {
    fontFamily: FONTS.title,
    fontSize: 28,
    color: COLORS.white,
    maxWidth: '60%',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomBlock: {
    gap: SPACING[3],
  },
  playerBadge: {
    alignSelf: 'flex-start',
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
