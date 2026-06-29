import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton, GuestGate, OutlinedText, RadialBackground } from '@/components/ui';
import { useAuthStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import { useTranslation } from '@/i18n';
import type { ProgramProfile } from '@/types/program';

export default function ProgramProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ programId: string; playerName?: string }>();
  const user = useAuthStore((state) => state.user);
  const isGuest = user?.isGuest ?? true;
  const programs = useProgramStore((state) => state.programs);
  const getProgramProgress = useProgramStore((state) => state.getProgramProgress);

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );
  // Seuls les personas activés et non-brouillon sont proposés au joueur.
  const profiles = (program?.profiles ?? []).filter((p) => p.enabled !== false && !p.isDraft);
  const progress = getProgramProgress(params.programId, user?.id);

  const [selectedId, setSelectedId] = useState<string | null>(profiles[0]?.id ?? null);

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

  const goToMode = () => {
    const profile = profiles.find((p) => p.id === selectedId);
    router.push({
      pathname: '/(programs)/play/mode/[programId]',
      params: {
        programId: program.id,
        playerName: params.playerName ?? '',
        profileId: profile?.id ?? '',
        profileName: profile?.name ?? '',
      },
    });
  };

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </Pressable>
        <OutlinedText text={t('program.yourProfile')} style={styles.headerTitle} outlineColor="#0E699C" outlineWidth={1.4} />
        <Text style={styles.headerStep}>{t('program.levelProgress', { current: Math.min(progress.currentLevel + 1, progress.totalLevels), total: progress.totalLevels })}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          {t('program.playIntroProfile', { count: progress.totalLevels })}
        </Text>

        {profiles.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {t('program.noProfileDefined')}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                selected={selectedId === profile.id}
                color={program.primaryColor}
                onPress={() => setSelectedId(profile.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[3] }]}>
        <GameButton
          title={t('program.continueWithProfile')}
          variant="yellow"
          fullWidth
          disabled={profiles.length > 0 && !selectedId}
          onPress={goToMode}
        />
      </View>
    </View>
  );
}

function ProfileCard({
  profile,
  selected,
  color,
  onPress,
}: {
  profile: ProgramProfile;
  selected: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && { borderColor: COLORS.primary }]}>
      {selected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={15} color="#0A1929" />
        </View>
      )}
      <View style={styles.avatarWrap}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={26} color={COLORS.white} />
          </View>
        )}
      </View>

      <OutlinedText
        text={`${profile.name}, ${profile.age}`}
        style={styles.cardName}
        outlineColor={selected ? '#2E7D32' : '#0E699C'}
        outlineWidth={1.1}
      />
      <Text style={styles.cardDesc} numberOfLines={3}>{profile.description}</Text>

      {!!profile.location && (
        <View style={styles.chip}>
          <Ionicons name="location" size={12} color={color} />
          <Text style={styles.chipText}>{profile.location}</Text>
        </View>
      )}
      {!!profile.sector && (
        <View style={styles.chip}>
          <Text style={[styles.chipText, { color }]}>{profile.sector}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.white,
  },
  headerStep: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    width: 70,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
    gap: SPACING[4],
  },
  intro: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
  },
  card: {
    width: '47%',
    padding: SPACING[4],
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderWidth: 0.75,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: SPACING[2],
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarWrap: {
    marginBottom: SPACING[1],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontFamily: FONTS.title,
    fontSize: 17,
    color: COLORS.white,
  },
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.white,
  },
  emptyBox: {
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[6],
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING[4],
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
    backgroundColor: '#0A1929',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
