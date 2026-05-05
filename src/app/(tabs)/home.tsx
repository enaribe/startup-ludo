import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View, type ViewToken } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ChallengeHomeCard, EnrollmentFormModal } from '@/components/challenges';
import { CreateStartupPromptPopup, OnboardingModal, ReturnBonusPopup } from '@/components/game/popups';
import { ProgramIcon } from '@/components/icons';
import { Avatar, DynamicGradientBorder, GameButton, InfoModal, ProgressionPopup, RadialBackground } from '@/components/ui';
import type { InfoSection } from '@/components/ui';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useReturnBonus } from '@/hooks/useReturnBonus';
import { useStartupCreationPrompt } from '@/hooks/useStartupCreationPrompt';
import { useChallengeEnroll } from '@/hooks/useChallengeEnroll';

import { formatXP, getRankProgress, getXPForNextRank } from '@/config/progression';
import { ALL_CHALLENGES, refreshChallengesFromFirestore } from '@/data/challenges';
import { useAuthStore, useChallengeStore, useUserStore } from '@/stores';
import { FONTS } from '@/styles/typography';
import type { Challenge } from '@/types/challenge';
import { formatFCFARaw } from '@/utils/currency';

const { width } = Dimensions.get('window');

/** Formate un nombre en version courte (k, M, B) pour gagner de l'espace */
function formatShortValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(Math.round(value));
}

// Texte avec contour (stroke) simulé par empilement de Text décalés
const OutlinedText = memo(function OutlinedText({
  text,
  style,
  outlineColor,
  outlineWidth = 2,
}: {
  text: string;
  style: object;
  outlineColor: string;
  outlineWidth?: number;
}) {
  const offsets = [
    { x: -outlineWidth, y: -outlineWidth },
    { x: 0, y: -outlineWidth },
    { x: outlineWidth, y: -outlineWidth },
    { x: outlineWidth, y: 0 },
    { x: outlineWidth, y: outlineWidth },
    { x: 0, y: outlineWidth },
    { x: -outlineWidth, y: outlineWidth },
    { x: -outlineWidth, y: 0 },
  ];
  return (
    <View>
      {offsets.map((offset, i) => (
        <Text
          key={i}
          style={[style, { color: outlineColor, position: 'absolute', left: offset.x, top: offset.y }]}
          numberOfLines={1}
        >
          {text}
        </Text>
      ))}
      <Text style={[style, { color: '#FFFFFF' }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
});

// Rayons tournants sous le logo
const SpinningRays = memo(function SpinningRays() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.raysWrapper, animatedStyle]}>
      <Image
        source={require('../../../assets/images/shape.png')}
        style={styles.raysImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
});

const HOME_INFO_SECTIONS: InfoSection[] = [
  {
    icon: 'star',
    title: 'XP & NIVEAU',
    body: "Gagne de l'XP en jouant des parties. Plus tu accumules d'XP, plus ton niveau monte et tu débloques de nouveaux rangs.",
  },
  {
    icon: 'briefcase',
    title: 'PORTFOLIO',
    body: 'La valorisation totale de tes entreprises créées lors des parties. Chaque levée de fonds augmente la valeur de ton entreprise.',
  },
  {
    icon: 'school',
    title: 'PROGRAMMES',
    body: 'Des défis thématiques pour progresser sur des compétences entrepreneuriales spécifiques. Rejoins un programme pour débloquer des niveaux spéciaux.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const userId = user?.id ?? '';

  const {
    showEnrollmentForm,
    activeChallengeName,
    handleEnroll,
    handleContinue,
    handleFormSubmit: handleEnrollmentFormSubmit,
    handleFormClose,
  } = useChallengeEnroll();
  const getEnrollmentForChallenge = useChallengeStore((s) => s.getEnrollmentForChallenge);

  const [showInfo, setShowInfo] = useState(false);
  const { visible: showOnboarding, complete: completeOnboarding } = useOnboarding();
  const { visible: showStartupPrompt, dismiss: dismissStartupPrompt } = useStartupCreationPrompt();
  const { visible: showReturnBonus, claim: claimReturnBonus, dismiss: dismissReturnBonus } = useReturnBonus();
  const [challengesLoaded, setChallengesLoaded] = useState(false);
  const [showProgression, setShowProgression] = useState(false);

  const { showProgression: showProgressionParam, xpGained: xpGainedParam, valorisationGain: valorisationGainParam } =
    useLocalSearchParams<{ showProgression?: string; xpGained?: string; valorisationGain?: string }>();
  // Capturer les valeurs au premier déclenchement uniquement, puis nettoyer le
  // param URL : sans ça, "showProgression=1" persiste et l'effect peut ré-ouvrir
  // le popup en arrière-plan à chaque re-render — ce qui bloque les taps sur
  // "Nouvelle partie" / challenges après que l'utilisateur l'ait fermé.
  const [progressionXpGained, setProgressionXpGained] = useState<number | undefined>(undefined);
  const [progressionValorisationGain, setProgressionValorisationGain] = useState<number | undefined>(undefined);
  const progressionHandledRef = useRef(false);
  useEffect(() => {
    if (showProgressionParam !== '1') {
      progressionHandledRef.current = false;
      return;
    }
    if (progressionHandledRef.current) return;
    progressionHandledRef.current = true;
    setProgressionXpGained(xpGainedParam ? parseInt(xpGainedParam, 10) : undefined);
    setProgressionValorisationGain(valorisationGainParam ? parseInt(valorisationGainParam, 10) : undefined);
    setShowProgression(true);
    router.setParams({
      showProgression: undefined,
      xpGained: undefined,
      valorisationGain: undefined,
    });
  }, [showProgressionParam, xpGainedParam, valorisationGainParam, router]);

  // Tous les challenges actifs : on affiche les challenges actifs globalement,
  // en mettant en tête ceux où l'utilisateur est inscrit (le ChallengeHomeCard
  // affichera "CONTINUER" pour les inscrits et "REJOINDRE" pour les autres).
  const userEnrollments = useChallengeStore((state) => state.enrollments);
  const enrolledChallenges = useMemo(() => {
    const activeChallenges = ALL_CHALLENGES.filter((c) => c.isActive);
    if (!userId) return activeChallenges;
    const userChallengeIds = new Set(
      userEnrollments.filter((e) => e.userId === userId).map((e) => e.challengeId),
    );
    // Trie : inscrits d'abord, puis les autres dans leur ordre d'origine
    return [...activeChallenges].sort((a, b) => {
      const aEnrolled = userChallengeIds.has(a.id) ? 0 : 1;
      const bEnrolled = userChallengeIds.has(b.id) ? 0 : 1;
      return aEnrolled - bEnrolled;
    });
  }, [userEnrollments, userId, challengesLoaded]);

  // Refresh challenges when screen mounts or focuses
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        await refreshChallengesFromFirestore();
        setChallengesLoaded(true);
      } catch (error) {
        console.error('[Home] Failed to load challenges:', error);
        setChallengesLoaded(true); // Still set true to show fallback
      }
    };
    loadChallenges();
  }, []);

  // Horizontal challenge carousel
  const challengeListRef = useRef<FlatList<Challenge>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const CARD_WIDTH = width - 36; // full width minus horizontal padding

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first && first.index != null) {
        setActiveIndex(first.index);
      }
    }
  ).current;

  const scrollToIndex = useCallback((index: number) => {
    if (index >= 0 && index < enrolledChallenges.length) {
      challengeListRef.current?.scrollToIndex({ index, animated: true });
      setActiveIndex(index);
    }
  }, [enrolledChallenges.length]);

  // Calculs de progression (rang)
  const totalXP = profile?.xp ?? 0;
  const rankProgress = getRankProgress(totalXP);
  const nextRankInfo = getXPForNextRank(totalXP);

  // Stats du portfolio
  const startupsCount = profile?.startups?.length ?? 0;
  const portfolioValue = profile?.startups?.reduce((sum, s) => sum + s.tokensInvested, 0) ?? 0;

  const isGuest = user?.isGuest ?? true;
  const displayName = user?.displayName || profile?.displayName || 'Joueur';

  // Guard anti double-tap : un second clic rapide pendant la navigation
  // peut être avalé par expo-router (la première navigation gèle l'écran
  // pendant la transition, le second tap ne fait rien et donne l'impression
  // que le bouton ne réagit pas).
  const navigatingRef = useRef(false);
  // Reset au focus de l'écran : si une navigation a été annulée (back, swipe),
  // le ref pouvait rester collé à `true` et bloquer tous les taps suivants
  // jusqu'au prochain reload — symptôme du bug "ça ne passe pas".
  useFocusEffect(
    useCallback(() => {
      navigatingRef.current = false;
    }, [])
  );
  const handlePlay = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push('/(game)/mode-selection');
    // Réautorise un nouveau push après la transition d'écran
    setTimeout(() => {
      navigatingRef.current = false;
    }, 300);
  }, [router]);

  // Hauteur réservée sous le header fixe (alignée sur le layout compact ci-dessous)
  const headerHeight = insets.top + 188;

  return (
    <View style={styles.container}>
      {/* Background Radial Gradient SVG */}
      <RadialBackground />

      {/* Header Fixe — bordure gradient (design system) */}
      {/* pointerEvents="box-none" : laisse passer les taps sur les zones
          transparentes (coins arrondis) vers le contenu scrollable en dessous */}
      <View style={styles.fixedHeaderOuter} pointerEvents="box-none">
        <DynamicGradientBorder
          borderRadius={32}
          fill="#0A1929"
          boxWidth={width}
          style={styles.headerGradientBorder}
        >
          <View
            style={[
              styles.fixedHeaderInner,
              { paddingTop: insets.top + 6 },
            ]}
          >
        {/* Top Row: Avatar + Logo + Settings */}
        <View style={styles.headerTopRow}>
          {/* Avatar (Left) */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Pressable onPress={() => router.push('/(tabs)/profil')}>
              <Avatar
                name={displayName}
                size="sm"
                variant="homeHeader"
              />
            </Pressable>
          </Animated.View>

          {/* Logo (Center) */}
          <View style={styles.logoWrapper}>
            {/* <View style={styles.classiqueTag}>
              <Text style={styles.classiqueTagText}>CLASSIQUE</Text>
            </View> */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.logoContainer}>
              <SpinningRays />
              <Image
                source={require('../../../assets/images/logostartupludo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Info Icon (Right) */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Pressable onPress={() => setShowInfo(true)} style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={24} color="#FFBC40" />
            </Pressable>
          </Animated.View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValueLuckiest}>{startupsCount}</Text>
            <Text style={styles.statLabel}>Entreprises</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValueLuckiest} numberOfLines={1} adjustsFontSizeToFit>
              {formatFCFARaw(portfolioValue)}
            </Text>
            <Text style={styles.statLabel}>Valorisation</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={[styles.statItem, styles.statItemXp]}>
            <Text style={styles.xpRankLabel} numberOfLines={1}>
              Progression
            </Text>
            <View style={styles.xpBarContainer}>
              <View style={[styles.xpBarFill, { width: `${rankProgress}%` }]} />
            </View>
            <Text style={styles.xpTextValue} numberOfLines={1} adjustsFontSizeToFit>
              {nextRankInfo.nextRank
                ? `${formatXP(totalXP)} / ${formatXP(nextRankInfo.nextRank.minXP)} XP`
                : `${formatXP(totalXP)} XP · Rang max`}
            </Text>
          </View>
        </View>
          </View>
        </DynamicGradientBorder>
      </View>

      {/* Contenu scrollable */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 12 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Play Button */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Pressable onPress={handlePlay} hitSlop={12} android_disableSound={false}>
            <View style={styles.playButtonContainer}>
              <LinearGradient
                colors={['#FFDC64', '#F0B432']}
                style={styles.playButtonGradient}
              >
                <View style={styles.playButtonContent}>
                  <View style={styles.diceIconContainer}>
                    <Svg width="48" height="51" viewBox="0 0 48 51" fill="none">
                      <Path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M9.26707 2.76963L2.74966 9.34487C-0.24989 12.371 -0.249887 17.2774 2.74967 20.3036L9.26707 26.8788C12.2666 29.905 17.1299 29.905 20.1294 26.8788L26.6468 20.3036C29.6464 17.2774 29.6464 12.371 26.6468 9.34486L20.1294 2.76962C17.1299 -0.256544 12.2666 -0.256541 9.26707 2.76963ZM12.4285 5.24234C11.1786 6.50324 11.1786 8.54757 12.4285 9.80847C13.6783 11.0694 15.7046 11.0694 16.9544 9.80847L16.9675 9.79532C18.2173 8.53442 18.2173 6.49009 16.9675 5.22919C15.7177 3.96828 13.6913 3.96828 12.4415 5.22919L12.4285 5.24234ZM5.18704 17.1138C3.93723 15.8529 3.93723 13.8086 5.18704 12.5477L5.20008 12.5345C6.44989 11.2736 8.47624 11.2736 9.72605 12.5345C10.9759 13.7954 10.9759 15.8398 9.72605 17.1007L9.71302 17.1138C8.4632 18.3747 6.43686 18.3747 5.18704 17.1138ZM12.4285 19.8538C11.1786 21.1147 11.1786 23.1591 12.4285 24.42C13.6783 25.6809 15.7046 25.6809 16.9544 24.42L16.9675 24.4068C18.2173 23.1459 18.2173 21.1016 16.9675 19.8407C15.7177 18.5798 13.6913 18.5798 12.4415 19.8407L12.4285 19.8538ZM19.6702 17.1138C18.4204 15.8529 18.4204 13.8086 19.6702 12.5477L19.6832 12.5345C20.933 11.2736 22.9594 11.2736 24.2092 12.5345C25.459 13.7954 25.459 15.8398 24.2092 17.1007L24.1962 17.1138C22.9463 18.3747 20.92 18.3747 19.6702 17.1138Z"
                        fill="white"
                      />
                      <Path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M22.9213 33.4522V42.751C22.9213 47.0307 26.3602 50.5 30.6022 50.5H39.8192C44.0612 50.5 47.5 47.0307 47.5 42.751V33.4522C47.5 29.1726 44.0612 25.7032 39.8192 25.7032H30.6022C26.3601 25.7032 22.9213 29.1726 22.9213 33.4522ZM26.8898 32.9449C26.8898 34.7281 28.3227 36.1737 30.0902 36.1737C31.8577 36.1737 33.2905 34.7281 33.2905 32.9449V32.9263C33.2905 31.1432 31.8577 29.6976 30.0902 29.6976C28.3227 29.6976 26.8898 31.1432 26.8898 32.9263V32.9449ZM40.3313 46.5061C38.5638 46.5062 37.1309 45.0606 37.1309 43.2774V43.2588C37.1309 41.4756 38.5638 40.0301 40.3313 40.0301C42.0988 40.0301 43.5316 41.4756 43.5316 43.2588V43.2774C43.5316 45.0606 42.0988 46.5061 40.3313 46.5061Z"
                        fill="white"
                      />
                      <Path
                        d="M46.9999 33.4518C46.9998 29.4442 43.7808 26.2029 39.8192 26.2028H30.6024C26.6407 26.2028 23.4208 29.4442 23.4208 33.4518V42.7506C23.4208 46.7583 26.6407 49.9997 30.6024 49.9997H39.8192C43.7808 49.9996 46.9999 46.7583 46.9999 42.7506V33.4518ZM43.0311 43.2585C43.0311 41.7472 41.8181 40.5299 40.3309 40.5299C38.8438 40.5301 37.6307 41.7473 37.6307 43.2585V43.277C37.6307 44.7882 38.8438 46.0054 40.3309 46.0055C41.8181 46.0055 43.0311 44.7882 43.0311 43.277V43.2585ZM32.7899 32.9264C32.7899 31.4152 31.5769 30.1969 30.0897 30.1969C28.6026 30.1971 27.3895 31.4153 27.3895 32.9264V32.945C27.3897 34.4559 28.6028 35.6733 30.0897 35.6735C31.5768 35.6735 32.7897 34.456 32.7899 32.945V32.9264ZM8.91197 2.41764C12.1071 -0.805879 17.2891 -0.80588 20.4842 2.41764L27.0018 8.99283C30.1943 12.2139 30.1943 17.4339 27.0018 20.6549L20.4842 27.2301C17.2891 30.4537 12.1071 30.4537 8.91197 27.2301L2.39439 20.6549C-0.798127 17.4339 -0.798136 12.2139 2.39439 8.99283L8.91197 2.41764ZM19.7743 3.12174C16.9703 0.29292 12.4259 0.29292 9.62193 3.12174L3.10436 9.69693C0.298451 12.5281 0.298459 17.1197 3.10436 19.9508L9.62193 26.526C12.4259 29.3549 16.9703 29.3549 19.7743 26.526L26.2919 19.9508C29.0978 17.1197 29.0978 12.5281 26.2919 9.69693L19.7743 3.12174ZM12.0858 19.488C13.5311 18.0298 15.8767 18.0301 17.3221 19.488C18.7651 20.9438 18.7651 23.3027 17.3221 24.7585L17.3094 24.7721C15.864 26.2301 13.5185 26.2293 12.0731 24.7712C10.6304 23.3154 10.6303 20.9573 12.0731 19.5016L12.0858 19.488ZM16.6122 20.1921C15.558 19.1288 13.8509 19.1288 12.7967 20.1921L12.7831 20.2057C11.7267 21.2718 11.7265 23.0021 12.7831 24.068C13.8373 25.1316 15.5453 25.1315 16.5995 24.068L16.6122 24.0544C17.6688 22.9883 17.6688 21.258 16.6122 20.1921ZM4.84459 12.1823C6.29001 10.724 8.63549 10.7241 10.0809 12.1823C11.5239 13.6381 11.5239 15.997 10.0809 17.4528L10.0682 17.4655C8.62281 18.9237 6.27733 18.9237 4.83189 17.4655C3.3889 16.0097 3.3889 13.6508 4.83189 12.195L4.84459 12.1823ZM19.328 12.1823C20.7734 10.724 23.1189 10.724 24.5643 12.1823C26.0072 13.6381 26.0073 15.997 24.5643 17.4528L24.5506 17.4645C23.1053 18.9227 20.7607 18.9236 19.3153 17.4655C17.8723 16.0097 17.8723 13.6508 19.3153 12.195L19.328 12.1823ZM9.37096 12.8864C8.3168 11.8229 6.60974 11.823 5.55553 12.8864L5.54186 12.8991C4.48527 13.965 4.48536 15.6954 5.54186 16.7614C6.596 17.8249 8.30307 17.8248 9.35728 16.7614L9.37096 16.7487C10.4275 15.6827 10.4274 13.9524 9.37096 12.8864ZM23.8544 12.8864C22.8002 11.8228 21.0921 11.8228 20.0379 12.8864L20.0253 12.8991C18.9686 13.9651 18.9686 15.6954 20.0253 16.7614C21.0794 17.8249 22.7865 17.8249 23.8407 16.7614L23.8544 16.7487C24.9108 15.6828 24.9107 13.9524 23.8544 12.8864ZM12.0858 4.87662C13.5311 3.41846 15.8767 3.41865 17.3221 4.87662C18.7651 6.33243 18.7651 8.69133 17.3221 10.1471L17.3094 10.1598C15.864 11.6181 13.5185 11.6181 12.0731 10.1598C10.6304 8.70407 10.6304 6.34604 12.0731 4.89029L12.0858 4.87662ZM16.6122 5.58072C15.558 4.51732 13.8509 4.5174 12.7967 5.58072L12.7831 5.5944C11.7269 6.6603 11.727 8.38981 12.7831 9.45572C13.8373 10.5193 15.5453 10.5193 16.5995 9.45572L16.6122 9.44303C17.6688 8.37702 17.6688 6.64673 16.6122 5.58072ZM44.0311 43.277C44.0311 45.3322 42.3787 47.0055 40.3309 47.0055C38.2832 47.0054 36.6307 45.3321 36.6307 43.277V43.2585C36.6307 41.2034 38.2832 39.5301 40.3309 39.5299C42.3787 39.5299 44.0311 41.2033 44.0311 43.2585V43.277ZM47.9999 42.7506C47.9999 47.3022 44.3414 50.9996 39.8192 50.9997H30.6024C26.0801 50.9997 22.4208 47.3023 22.4208 42.7506V33.4518C22.4208 28.9002 26.0801 25.2028 30.6024 25.2028H39.8192C44.3414 25.2029 47.9998 28.9003 47.9999 33.4518V42.7506ZM33.7899 32.945C33.7897 35 32.1374 36.6735 30.0897 36.6735C28.0422 36.6733 26.3897 34.9999 26.3895 32.945V32.9264C26.3895 30.8714 28.0421 29.1971 30.0897 29.1969C32.1375 29.1969 33.7899 30.8713 33.7899 32.9264V32.945Z"
                        fill="#AC700C"
                      />
                    </Svg>
                  </View>
                  <View style={styles.playButtonTextWrapper}>
                    <OutlinedText
                      text="NOUVELLE PARTIE"
                      style={styles.playButtonTitle}
                      outlineColor="#172735"
                      outlineWidth={1.2}
                    />
                    <Text style={styles.playButtonSubtitle}>Rejoins ou crée une partie avec tes amis</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Pressable>
        </Animated.View>

        {/* Challenge Section */}
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeHeaderTitle}>CHALLENGE EN COURS</Text>
          {!isGuest && (
            <Pressable onPress={() => router.push('/(challenges)/challenge-explorer')}>
              <Text style={styles.voirPlusText}>VOIR PLUS</Text>
            </Pressable>
          )}
        </View>

        {isGuest ? (
          /* Teaser programmes pour les invités */
          <View style={styles.challengeCardWrapper}>
            <Animated.View entering={FadeInDown.delay(600).duration(500)}>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
                  <View style={styles.emptyCardContent}>
                    <View style={styles.emptyCardLeft}>
                      <View style={styles.emptyLogoContainer}>
                        <Ionicons name="lock-closed-outline" size={26} color="rgba(255, 188, 64, 0.6)" />
                      </View>
                      <View style={styles.emptyCardInfo}>
                        <Text style={styles.emptyCardTitle}>PROGRAMMES</Text>
                        <Text style={styles.emptyCardSub}>Crée un compte pour accéder aux programmes</Text>
                      </View>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color="#FFBC40" />
                  </View>
                </DynamicGradientBorder>
              </Pressable>
            </Animated.View>
          </View>
        ) : enrolledChallenges.length > 0 ? (
          <View style={styles.challengeCardWrapper}>
            <FlatList
              ref={challengeListRef}
              data={enrolledChallenges}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH}
              decelerationRate="fast"
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
              getItemLayout={(_, index) => ({
                length: CARD_WIDTH,
                offset: CARD_WIDTH * index,
                index,
              })}
              renderItem={({ item: challenge }) => {
                const enrollment = getEnrollmentForChallenge(challenge.id, userId);
                return (
                  <View style={{ width: CARD_WIDTH }}>
                    <ChallengeHomeCard
                      challenge={challenge}
                      enrollment={enrollment ?? null}
                      onEnroll={() => handleEnroll(challenge.id)}
                      onContinue={() => handleContinue(challenge.id)}
                    />
                  </View>
                );
              }}
            />
            {enrolledChallenges.length > 1 && (
              <View style={styles.pagination}>
                {enrolledChallenges.map((c, i) => (
                  <View key={c.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.challengeCardWrapper}>
            <Animated.View entering={FadeInDown.delay(600).duration(500)}>
              <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
                <View style={styles.emptyProgramContent}>
                  <ProgramIcon size={48} color="#71808E" />
                  <View style={styles.emptyProgramTextWrap}>
                    <Text style={styles.emptyProgramTitle}>AUCUN PROGRAMME</Text>
                    <Text style={styles.emptyProgramSub}>
                      Aucun programme actif pour le moment.{'\n'}Reviens bientôt pour découvrir{'\n'}les prochains défis !
                    </Text>
                  </View>
                  <View style={styles.emptyProgramButtonWrap}>
                    <GameButton
                      variant="yellow"
                      fullWidth
                      title="EXPLORER LES PROGRAMMES"
                      onPress={() => router.push('/(challenges)/challenge-explorer')}
                    />
                  </View>
                </View>
              </DynamicGradientBorder>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* Formulaire d'inscription au challenge */}
      <EnrollmentFormModal
        visible={showEnrollmentForm}
        challengeName={activeChallengeName}
        onSubmit={handleEnrollmentFormSubmit}
        onClose={handleFormClose}
      />

      {/* Onboarding (première connexion uniquement) */}
      <OnboardingModal
        visible={showOnboarding}
        onComplete={completeOnboarding}
      />

      {/* Popup bonus reconnexion */}
      <ReturnBonusPopup
        visible={showReturnBonus}
        onClaim={claimReturnBonus}
        onDismiss={dismissReturnBonus}
      />

      {/* Popup création startup */}
      <CreateStartupPromptPopup
        visible={showStartupPrompt}
        onCreateStartup={() => {
          dismissStartupPrompt();
          router.push('/(startup)/ideation');
        }}
        onDismiss={dismissStartupPrompt}
      />

      {/* Popup progression post-partie */}
      <ProgressionPopup
        visible={showProgression}
        onContinue={() => {
          setShowProgression(false);
          // Sécurité : si le ref était resté collé (Android, transitions), on
          // le débloque dès la fermeture du popup pour que les taps sur
          // "Nouvelle partie" / challenges fonctionnent immédiatement.
          navigatingRef.current = false;
        }}
        xpGained={progressionXpGained}
        valorisationGain={progressionValorisationGain}
      />

      {/* Info Modal */}
      <InfoModal
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        variant="accueil"
        description="Ton tableau de bord personnel. Suis ta progression et accède à tes programmes d'entraînement."
        sections={HOME_INFO_SECTIONS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  fixedHeaderOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'visible',
  },
  headerGradientBorder: {
    width: '100%',
    alignSelf: 'stretch',
  },
  fixedHeaderInner: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    overflow: 'visible',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  classiqueTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: -10,
    zIndex: 2,
  },
  classiqueTagText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  infoButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 72,
    overflow: 'visible',
  },
  raysWrapper: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  raysImage: {
    width: 150,
    height: 150,
    opacity: 0.3,
  },
  logo: {
    width: 100,
    height: 56,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 150,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 0,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 6,
  },
  statItemXp: {
    paddingHorizontal: 4,
    justifyContent: 'space-evenly',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  statValueLuckiest: {
    fontFamily: FONTS.title,
    fontSize: 17,
    color: '#FFBC40',
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
    textAlign: 'center',
  },
  xpRankLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: '#FFBC40',
    marginBottom: 3,
    textAlign: 'center',
    width: '100%',
  },
  xpTextValue: {
    fontFamily: FONTS.body,
    fontSize: 8,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
    textAlign: 'center',
    width: '100%',
  },
  xpBarContainer: {
    width: '100%',
    maxWidth: 112,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#FFBC40',
    borderRadius: 3,
  },
  // Play Button
  playButtonContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonGradient: {
    width: '100%',
  },
  playButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    height: 100,
  },
  diceIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonTextWrapper: {
    marginLeft: 15,
    flex: 1,
  },
  playButtonTitle: {
    fontFamily: FONTS.title,
    fontSize: 26,
    letterSpacing: 0.5,
  },
  playButtonSubtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: 'rgba(12, 36, 62, 0.7)',
    marginTop: 2,
  },
  // Challenge
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  challengeHeaderTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
  },
  voirPlusText: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: '#FFBC40',
  },
  challengeNav: {
    flexDirection: 'row',
    gap: 8,
  },
  challengeNavBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeNavBtnActive: {
    backgroundColor: 'rgba(255, 188, 64, 0.1)',
  },
  challengeCardWrapper: {
    marginBottom: 8,
  },
  challengeCardContent: {
    padding: 14,
  },
  challengeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  challengeImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeImageLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    color: '#FFBC40',
    marginTop: 2,
  },
  challengeMeta: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 0,
  },
  categoryBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  challengeNameText: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
  },
  challengeDescText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 10,
  },
  challengeStatsWrapper: {
    marginBottom: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  challengeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    paddingHorizontal: 12,
    width: '100%',
  },
  statWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  challengeStatText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: '#FFBC40',
  },
  challengeStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dotActive: {
    backgroundColor: '#FFBC40',
    width: 30,
  },
  // Tab Bar
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A1A2F',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: FONTS.title,
    fontSize: 9,
    color: '#71808E',
    marginTop: 5,
  },
  tabTextActive: {
    color: '#FFBC40',
  },
  ludoIconContainer: {
    gap: 2,
  },
  ludoRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ludoSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ludoText: {
    color: '#FFFFFF',
    fontFamily: FONTS.title,
    fontSize: 7,
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F35145',
  },
  emptyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emptyLogoContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 188, 64, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.15)',
  },
  emptyCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emptyCardTitle: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: '#FFFFFF',
  },
  emptyCardSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },

  // Empty state — design refait
  emptyProgramContent: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyProgramTextWrap: {
    alignItems: 'center',
    gap: 6,
  },
  emptyProgramTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  emptyProgramSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyProgramButtonWrap: {
    width: '100%',
    marginTop: 4,
  },
});
