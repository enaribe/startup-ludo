import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgramEnrollmentModal } from '@/components/programs';
import { DynamicGradientBorder, GameButton, GuestGate, RadialBackground } from '@/components/ui';
import { useAuthStore, useGameStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import type { ProgramEnrollmentFormData } from '@/types/program';

export default function ProgramPlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ programId: string }>();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const isGuest = user?.isGuest ?? true;
  const programs = useProgramStore((state) => state.programs);
  const partners = useProgramStore((state) => state.partners);
  const enrollments = useProgramStore((state) => state.enrollments);
  const sessions = useProgramStore((state) => state.sessions);
  const enrollInProgram = useProgramStore((state) => state.enrollInProgram);
  const createProgramSession = useProgramStore((state) => state.createProgramSession);
  const initGame = useGameStore((state) => state.initGame);
  const [showEnroll, setShowEnroll] = useState(false);

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );
  const partner = useMemo(
    () => program ? partners.find((item) => item.id === program.partnerId) : undefined,
    [partners, program]
  );
  const enrollment = useMemo(
    () => enrollments.find((item) => item.programId === params.programId && item.userId === userId),
    [enrollments, params.programId, userId]
  );
  const access = useMemo(() => {
    if (!program || !program.isActive) {
      return { canPlay: false, reason: 'program_not_found' as const, requiresEnrollment: false, isTrial: false };
    }
    if (!userId || isGuest) {
      return { canPlay: false, reason: 'guest_blocked' as const, requiresEnrollment: true, isTrial: false };
    }
    if (enrollment?.formData) {
      return { canPlay: true, reason: 'enrolled' as const, requiresEnrollment: false, isTrial: false };
    }
    const hasPlayed = sessions.some((session) => session.programId === params.programId && session.userId === userId);
    return hasPlayed
      ? { canPlay: false, reason: 'trial_used' as const, requiresEnrollment: true, isTrial: false }
      : { canPlay: true, reason: 'trial_available' as const, requiresEnrollment: false, isTrial: true };
  }, [program, userId, isGuest, enrollment, sessions, params.programId]);

  if (isGuest) {
    return (
      <GuestGate
        featureName="Programmes"
        description="Cree un compte pour jouer les programmes partenaires contre l'IA."
      />
    );
  }

  if (!program) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <View style={styles.center}>
          <Text style={styles.errorText}>Programme introuvable</Text>
          <GameButton title="Retour" variant="blue" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const startGame = () => {
    if (!access.canPlay) {
      setShowEnroll(true);
      return;
    }

    const gameId = `program_${program.id}_${Date.now()}`;
    const session = createProgramSession(program.id, userId, access.isTrial, gameId);
    if (!session) return;

    initGame(
      'solo',
      'classic',
      [
        {
          id: userId,
          name: user?.displayName || 'Vous',
          color: 'green',
          isAI: false,
          isHost: true,
          isConnected: true,
        },
        {
          id: `ai_${program.id}`,
          name: 'IA Programme',
          color: 'blue',
          isAI: true,
          isHost: false,
          isConnected: true,
        },
      ],
      {
        origin: 'program',
        partnerId: program.partnerId,
        programId: program.id,
        enrollmentId: enrollment?.id ?? null,
        sessionId: session.id,
        isTrial: access.isTrial,
        contentPackId: program.contentPacks[0]?.id,
      }
    );

    router.replace({
      pathname: '/(game)/play/[gameId]',
      params: { gameId, mode: 'solo', programId: program.id, programSessionId: session.id },
    });
  };

  const handleEnroll = (formData: ProgramEnrollmentFormData) => {
    enrollInProgram(program.id, userId, formData);
    setShowEnroll(false);
  };

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>PARTIE PROGRAMME</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 100, paddingBottom: insets.bottom + 24 }]}>
        <DynamicGradientBorder borderRadius={24} fill="rgba(0,0,0,0.34)">
          <View style={styles.card}>
            <Text style={styles.partner}>{partner?.name ?? 'Partenaire'}</Text>
            <Text style={styles.title}>{program.name}</Text>
            <Text style={styles.subtitle}>
              {access.isTrial ? 'Partie de decouverte' : 'Progression programme'}
            </Text>
          </View>
        </DynamicGradientBorder>

        <View style={styles.vsCard}>
          <PlayerLine icon="person-outline" title={user?.displayName || 'Vous'} subtitle="Joueur" color={COLORS.players.green} />
          <View style={styles.vsDivider}>
            <View style={styles.vsLine} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsLine} />
          </View>
          <PlayerLine icon="hardware-chip-outline" title="IA Programme" subtitle="Adversaire" color={COLORS.players.blue} />
        </View>

        {!access.canPlay && (
          <View style={styles.lockBox}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
            <Text style={styles.lockText}>Inscris-toi au programme pour continuer apres ta partie de decouverte.</Text>
          </View>
        )}

        <GameButton
          title={access.canPlay ? 'COMMENCER' : "S'INSCRIRE"}
          variant="yellow"
          fullWidth
          onPress={startGame}
        />
      </View>

      <ProgramEnrollmentModal
        visible={showEnroll}
        programName={program.name}
        defaultFullName={user?.displayName}
        defaultEmail={user?.email}
        onSubmit={handleEnroll}
        onClose={() => setShowEnroll(false)}
      />
    </View>
  );
}

function PlayerLine({
  icon,
  title,
  subtitle,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <View style={styles.playerLine}>
      <View style={[styles.playerIcon, { borderColor: color }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerTitle}>{title}</Text>
        <Text style={styles.playerSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    position: 'absolute',
    zIndex: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 19,
    color: COLORS.white,
  },
  headerSpacer: { width: 44 },
  content: {
    flex: 1,
    paddingHorizontal: SPACING[4],
    gap: SPACING[4],
  },
  card: {
    padding: SPACING[5],
    gap: SPACING[2],
  },
  partner: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 26,
    color: COLORS.white,
  },
  subtitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  vsCard: {
    padding: SPACING[4],
    gap: SPACING[3],
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  playerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: { flex: 1 },
  playerTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.white,
  },
  playerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  vsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  vsText: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.primary,
  },
  lockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
    borderRadius: 16,
    backgroundColor: 'rgba(255,188,64,0.1)',
  },
  lockText: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
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
