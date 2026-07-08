import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocalModeIcon, OnlineModeIcon } from '@/components/game/ModeSelectionIcons';
import { DynamicGradientBorder, GameButton, GuestGate, OutlinedText, RadialBackground } from '@/components/ui';
import { useAuthStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useTranslation } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEME = {
  accent: '#FFBC40',
  cardFill: 'rgba(0, 0, 0, 0.35)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textMuted: 'rgba(127, 142, 158, 0.95)',
};

type ModeKey = 'local' | 'online';

const MODES: {
  key: ModeKey;
  titleKey: string;
  subtitleKey: string;
  tagIcon: keyof typeof Ionicons.glyphMap;
  tagKey: string;
  available: boolean;
}[] = [
  { key: 'local', titleKey: 'program.modeLocalTitle', subtitleKey: 'program.modeLocalSub', tagIcon: 'sparkles-outline', tagKey: 'program.modeLocalTag', available: true },
  { key: 'online', titleKey: 'program.modeOnlineTitle', subtitleKey: 'program.modeOnlineSub', tagIcon: 'trophy-outline', tagKey: 'program.modeOnlineTag', available: false },
];

export default function ProgramModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    programId: string;
    playerName?: string;
    profileId?: string;
    profileName?: string;
  }>();
  const user = useAuthStore((state) => state.user);
  const isGuest = user?.isGuest ?? true;
  const programs = useProgramStore((state) => state.programs);

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );

  if (isGuest) {
    return (
      <GuestGate
        featureName={t('program.featureName')}
        description={t('program.guestGenericDesc')}
      />
    );
  }

  if (!program) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('program.notFound')}</Text>
          <GameButton title={t('common.back')} variant="blue" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const handleMode = (mode: ModeKey, available: boolean) => {
    if (!available) return;
    if (mode === 'local') {
      // Écran suivant : configuration de la partie locale (solo vs IA / tour par tour).
      router.push({
        pathname: '/(programs)/play/mode/local/[programId]',
        params: {
          programId: program.id,
          playerName: params.playerName ?? '',
          profileId: params.profileId ?? '',
          profileName: params.profileName ?? '',
        },
      });
    }
  };

  const contentWidth = SCREEN_WIDTH - SPACING[4] * 2;
  const headerBlockHeight = insets.top + 72;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header — titre centré, style identique à « Nouvelle partie » */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + SPACING[2],
            backgroundColor: '#0A1929',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={THEME.text} />
          </Pressable>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>{t('program.gameMode')}</Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: headerBlockHeight + SPACING[5], paddingBottom: insets.bottom + SPACING[6] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.subtitleWrap}>
          <OutlinedText
            text={t('program.modeIntro', { count: program.contentPacks?.length ?? 1 })}
            style={styles.subtitle}
            outlineColor="#0A1929"
            outlineWidth={2}
          />
        </Animated.View>

        {MODES.map((mode, index) => (
          <Animated.View key={mode.key} entering={FadeInDown.delay(200 + index * 100).duration(500)}>
            <Pressable onPress={() => handleMode(mode.key, mode.available)} disabled={!mode.available}>
              <DynamicGradientBorder
                borderRadius={24}
                fill={THEME.cardFill}
                boxWidth={contentWidth}
                style={{ marginBottom: SPACING[4], opacity: mode.available ? 1 : 0.85 }}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconColumn}>
                    {mode.key === 'local' ? (
                      <LocalModeIcon size={40} />
                    ) : (
                      <OnlineModeIcon size={52} />
                    )}
                  </View>

                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{t(mode.titleKey)}</Text>
                    <Text style={styles.cardDescription}>{t(mode.subtitleKey)}</Text>

                    <View style={styles.tagsRow}>
                      <View style={styles.tag}>
                        <Ionicons name={mode.tagIcon} size={12} color={THEME.textMuted} />
                        <Text style={styles.tagText}>{t(mode.tagKey)}</Text>
                      </View>
                      {!mode.available && (
                        <View style={[styles.tag, styles.tagSoon]}>
                          <Ionicons name="time-outline" size={12} color={THEME.accent} />
                          <Text style={[styles.tagText, styles.tagTextSoon]}>{t('program.soon')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </DynamicGradientBorder>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[4],
    paddingHorizontal: SPACING[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(5, 25, 50, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTitleWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  headerRightSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: THEME.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  contentContainer: {
    paddingHorizontal: SPACING[4],
  },
  subtitleWrap: {
    marginBottom: SPACING[6],
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[5],
    paddingHorizontal: SPACING[4],
    gap: SPACING[4],
  },
  iconColumn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING[2],
    color: THEME.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING[3],
    lineHeight: 20,
    color: THEME.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagSoon: {
    backgroundColor: 'rgba(255, 188, 64, 0.14)',
    borderColor: 'rgba(255, 188, 64, 0.25)',
  },
  tagText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: THEME.textMuted,
    textTransform: 'capitalize',
  },
  tagTextSoon: {
    color: THEME.accent,
    textTransform: 'none',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING[4],
  },
  errorText: {
    fontFamily: FONTS.title,
    color: COLORS.white,
    fontSize: 20,
  },
});
