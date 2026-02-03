⏺ Fiche Technique - Design System & Animation Guidelines

  Startup Ludo - Challenge Module

  ---
  1. Structure des fichiers

  src/
  ├── app/
  │   ├── (challenges)/
  │   │   ├── _layout.tsx              # Stack navigator + init challenges
  │   │   ├── [challengeId].tsx        # Détail Challenge (pré/post inscription)
  │   │   ├── challenge-hub.tsx        # Hub progression (post-inscription)
  │   │   └── my-programs.tsx          # Liste des programmes
  │   │
  │   └── (game)/
  │       ├── challenge-game.tsx       # Config partie Challenge (solo vs IA)
  │       ├── play/[gameId].tsx        # Plateau (existant)
  │       └── results/[gameId].tsx     # Résultats (intègre XP Challenge)
  │
  ├── components/
  │   ├── challenges/
  │   │   ├── index.ts                 # Exports (5 composants)
  │   │   ├── ChallengeHomeCard.tsx    # Carte accueil (inscrit/non inscrit)
  │   │   ├── SectorChoiceModal.tsx    # Modal choix secteur (carousel)
  │   │   ├── PitchBuilderModal.tsx    # Formulaire pitch 5 étapes (create/view/edit)
  │   │   ├── BusinessPlanModal.tsx    # BP simple/complet (create/view/edit)
  │   │   └── FinalQuizModal.tsx       # Quiz final 16 questions + certificat
  │   │   # Note: LevelItem, SubLevelItem implémentés inline dans challenge-hub.tsx
  │   │
  │   └── ui/
  │       ├── RadialBackground.tsx
  │       ├── GradientBorder.tsx
  │       ├── DynamicGradientBorder.tsx
  │       ├── GameButton.tsx
  │       └── ...
  │
  ├── stores/
  │   ├── useChallengeStore.ts         # État Challenge (Zustand + immer + persist)
  │   └── useGameStore.ts              # État Jeu (initGame accepte ChallengeContext)
  │
  ├── types/
  │   ├── index.ts                     # Types généraux + ChallengeContext + GameState
  │   └── challenge.ts                 # Types Challenge (17 interfaces/types + helpers)
  │
  ├── config/
  │   └── progression.ts               # CHALLENGE_XP_MULTIPLIERS + getChallengeXP()
  │
  ├── styles/
  │   ├── colors.ts
  │   ├── typography.ts
  │   └── spacing.ts
  │
  └── data/
      └── challenges/
          ├── index.ts                 # Registry (ALL_CHALLENGES, getChallengeById, etc.)
          ├── yeah.ts                  # Config YEAH (4 niveaux, 4 secteurs, 16 sous-niveaux)
          └── quizQuestions.ts         # 16 questions quiz final + seuil 75%

  ---
  2. Design System

  2.1 Couleurs (src/styles/colors.ts)

  export const COLORS = {
    // Couleurs principales
    primary: '#FFBC40',           // Jaune/Or - Actions principales
    primaryLight: '#FFD580',
    primaryDark: '#CC9633',

    // Arrière-plans
    background: '#0C243E',        // Bleu foncé principal
    backgroundLight: '#194F8A',
    card: 'rgba(0, 0, 0, 0.3)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',

    // Texte
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',

    // États
    success: '#4CAF50',           // Vert - Complété/Validé
    successLight: 'rgba(76, 175, 80, 0.2)',
    error: '#F44336',             // Rouge - Erreur
    errorLight: 'rgba(244, 67, 54, 0.2)',
    warning: '#FF9800',           // Orange - Attention
    info: '#2196F3',              // Bleu - Info
    infoLight: 'rgba(33, 150, 243, 0.2)',

    // Couleurs joueurs
    players: {
      yellow: '#FFBC40',
      blue: '#1F91D0',
      green: '#4CAF50',
      red: '#F35145',
    },

    // Surfaces
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceVariant: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayDark: 'rgba(0, 0, 0, 0.7)',
  };

  2.2 Typographie (src/styles/typography.ts)

  export const FONTS = {
    title: 'LuckiestGuy_400Regular',     // Titres, boutons
    body: 'OpenSans_400Regular',          // Texte courant
    bodyMedium: 'OpenSans_500Medium',
    bodySemiBold: 'OpenSans_600SemiBold',
    bodyBold: 'OpenSans_700Bold',
  };

  export const FONT_SIZES = {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  };

  2.3 Espacements (src/styles/spacing.ts)

  export const SPACING = {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
  };

  export const BORDER_RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  };

  ---
  3. Composants UI de base

  3.1 Structure d'écran type

  import { View, StyleSheet, ScrollView } from 'react-native';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { RadialBackground } from '@/components/ui';
  import { COLORS } from '@/styles/colors';
  import { SPACING } from '@/styles/spacing';

  export default function ExampleScreen() {
    const insets = useSafeAreaInsets();

    return (
      <View style={styles.container}>
        {/* Background obligatoire */}
        <RadialBackground />

        {/* Header fixe */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
          {/* Bouton retour + Titre */}
        </View>

        {/* Contenu scrollable */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Contenu */}
        </ScrollView>

        {/* Footer fixe (optionnel) */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING[4] }]}>
          {/* Boutons d'action */}
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      paddingHorizontal: SPACING[4],
      paddingBottom: SPACING[3],
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SPACING[4],
      paddingBottom: 100, // Espace pour footer
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: SPACING[4],
      paddingTop: SPACING[3],
      backgroundColor: 'rgba(12, 36, 62, 0.95)',
      borderTopWidth: 1,
      borderTopColor: COLORS.cardBorder,
    },
  });

  3.2 Header avec bouton retour

  import { View, Text, Pressable, StyleSheet } from 'react-native';
  import { useRouter } from 'expo-router';
  import { Ionicons } from '@expo/vector-icons';
  import { COLORS } from '@/styles/colors';
  import { FONTS, FONT_SIZES } from '@/styles/typography';
  import { SPACING } from '@/styles/spacing';

  interface ScreenHeaderProps {
    title: string;
    onBack?: () => void;
    rightElement?: React.ReactNode;
  }

  export function ScreenHeader({ title, onBack, rightElement }: ScreenHeaderProps) {
    const router = useRouter();

    return (
      <View style={styles.header}>
        <Pressable 
          onPress={onBack || router.back} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.rightContainer}>
          {rightElement || <View style={styles.placeholder} />}
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      flex: 1,
      fontFamily: FONTS.title,
      fontSize: FONT_SIZES['2xl'],
      color: COLORS.white,
      textAlign: 'center',
    },
    rightContainer: {
      width: 40,
    },
    placeholder: {
      width: 40,
    },
  });

  3.3 Cartes avec bordure gradient

  import { DynamicGradientBorder } from '@/components/ui';
  import { BORDER_RADIUS } from '@/styles/spacing';

  // Carte standard
  <DynamicGradientBorder 
    borderRadius={BORDER_RADIUS.xl} 
    fill="rgba(0, 0, 0, 0.35)"
  >
    <View style={styles.cardContent}>
      {/* Contenu */}
    </View>
  </DynamicGradientBorder>

  // Carte sélectionnée/active
  <DynamicGradientBorder 
    borderRadius={BORDER_RADIUS.xl} 
    fill="rgba(255, 188, 64, 0.1)"  // Teinte primary
  >
    <View style={[styles.cardContent, styles.cardActive]}>
      {/* Contenu */}
    </View>
  </DynamicGradientBorder>

  3.4 Boutons

  import { GameButton } from '@/components/ui';

  // Bouton principal (jaune)
  <GameButton
    variant="yellow"
    fullWidth
    title="CONTINUER"
    onPress={handlePress}
  />

  // Bouton secondaire
  <Pressable style={styles.secondaryButton} onPress={handlePress}>
    <Text style={styles.secondaryButtonText}>ANNULER</Text>
  </Pressable>

  // Styles bouton secondaire
  secondaryButton: {
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[6],
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  secondaryButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  ---
  4. Animations avec Reanimated

  4.1 Imports obligatoires

  import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    SlideInRight,
    SlideOutLeft,
    withSpring,
    withTiming,
    useAnimatedStyle,
    useSharedValue,
    interpolate,
    Extrapolation,
  } from 'react-native-reanimated';

  4.2 Animations d'entrée (entering)

  // Fade in simple
  <Animated.View entering={FadeIn.duration(400)}>
    {/* Contenu */}
  </Animated.View>

  // Fade in depuis le bas (pour listes)
  <Animated.View entering={FadeInDown.delay(100).duration(400)}>
    {/* Item 1 */}
  </Animated.View>
  <Animated.View entering={FadeInDown.delay(200).duration(400)}>
    {/* Item 2 */}
  </Animated.View>

  // Pattern pour listes avec index
  {items.map((item, index) => (
    <Animated.View 
      key={item.id}
      entering={FadeInDown.delay(100 + index * 80).duration(400)}
    >
      {/* Item */}
    </Animated.View>
  ))}

  4.3 Durées recommandées

  | Type d'animation | Durée     | Delay entre items |
  |------------------|-----------|-------------------|
  | Fade in simple   | 300-400ms | -                 |
  | Fade in liste    | 400ms     | 80-100ms          |
  | Slide            | 300ms     | -                 |
  | Spring (rebond)  | -         | -                 |
  | Transition écran | 250ms     | -                 |

  4.4 Animations de barre de progression

  import { useEffect } from 'react';
  import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
  } from 'react-native-reanimated';

  interface ProgressBarProps {
    progress: number; // 0-100
    color?: string;
  }

  export function AnimatedProgressBar({ progress, color = COLORS.primary }: ProgressBarProps) {
    const width = useSharedValue(0);

    useEffect(() => {
      width.value = withTiming(progress, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => ({
      width: `${width.value}%`,
    }));

    return (
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBarFill, 
            { backgroundColor: color },
            animatedStyle
          ]} 
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    progressBarContainer: {
      height: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: BORDER_RADIUS.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: BORDER_RADIUS.full,
    },
  });

  4.5 Animation d'expansion (accordion)

  import { useState } from 'react';
  import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
  } from 'react-native-reanimated';

  export function ExpandableCard({ title, children }) {
    const [expanded, setExpanded] = useState(false);
    const animation = useSharedValue(0);

    const toggleExpand = () => {
      setExpanded(!expanded);
      animation.value = withTiming(expanded ? 0 : 1, { duration: 300 });
    };

    const contentStyle = useAnimatedStyle(() => ({
      height: interpolate(animation.value, [0, 1], [0, 200]),
      opacity: animation.value,
    }));

    const iconStyle = useAnimatedStyle(() => ({
      transform: [
        { rotate: `${interpolate(animation.value, [0, 1], [0, 180])}deg` }
      ],
    }));

    return (
      <Pressable onPress={toggleExpand}>
        <View style={styles.header}>
          <Text>{title}</Text>
          <Animated.View style={iconStyle}>
            <Ionicons name="chevron-down" size={20} color={COLORS.white} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.content, contentStyle]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  4.6 Animation de pulsation (pour attirer l'attention)

  import { useEffect } from 'react';
  import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
  } from 'react-native-reanimated';

  export function PulsingBadge({ children }) {
    const scale = useSharedValue(1);

    useEffect(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1, // Répéter indéfiniment
        true // Reverse
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    );
  }

  ---
  5. Patterns de composants Challenge

  5.1 Carte de niveau (LevelCard)

  import { memo, useState } from 'react';
  import { View, Text, Pressable, StyleSheet } from 'react-native';
  import { Ionicons } from '@expo/vector-icons';
  import Animated, { FadeInDown } from 'react-native-reanimated';
  import { DynamicGradientBorder } from '@/components/ui';
  import type { ChallengeLevel } from '@/types/challenge';

  interface LevelCardProps {
    level: ChallengeLevel;
    status: 'locked' | 'current' | 'completed';
    xpProgress: number;
    currentSubLevel?: number;
    onPress?: () => void;
    index: number;
  }

  export const LevelCard = memo(function LevelCard({
    level,
    status,
    xpProgress,
    currentSubLevel,
    onPress,
    index,
  }: LevelCardProps) {
    const [expanded, setExpanded] = useState(status === 'current');

    // Icône selon le statut
    const statusIcon = {
      locked: 'lock-closed',
      current: 'radio-button-on',
      completed: 'checkmark-circle',
    }[status];

    // Couleur selon le statut
    const statusColor = {
      locked: COLORS.textMuted,
      current: COLORS.primary,
      completed: COLORS.success,
    }[status];

    const progressPercent = (xpProgress / level.xpRequired) * 100;

    return (
      <Animated.View entering={FadeInDown.delay(100 + index * 80).duration(400)}>
        <Pressable onPress={() => status !== 'locked' && setExpanded(!expanded)}>
          <DynamicGradientBorder
            borderRadius={BORDER_RADIUS.lg}
            fill={status === 'current' ? 'rgba(255, 188, 64, 0.08)' : 'rgba(0, 0, 0, 0.25)'}
          >
            <View style={[styles.card, status === 'locked' && styles.cardLocked]}>
              {/* Header */}
              <View style={styles.header}>
                <Ionicons name={statusIcon} size={24} color={statusColor} />
                <View style={styles.info}>
                  <Text style={[styles.title, status === 'locked' && styles.titleLocked]}>
                    Niveau {level.number} - {level.name}
                  </Text>
                  <Text style={styles.posture}>{level.posture}</Text>
                </View>
                <Text style={styles.xp}>
                  {xpProgress} / {level.xpRequired} XP
                </Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </View>

              {/* Barre de progression */}
              {status !== 'locked' && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
              )}

              {/* Sous-niveaux (expanded) */}
              {expanded && status !== 'locked' && (
                <View style={styles.subLevels}>
                  {level.subLevels.map((subLevel) => (
                    <SubLevelItem
                      key={subLevel.id}
                      subLevel={subLevel}
                      isCurrent={status === 'current' && subLevel.number === currentSubLevel}
                      isCompleted={
                        status === 'completed' ||
                        (status === 'current' && subLevel.number < currentSubLevel!)
                      }
                    />
                  ))}
                </View>
              )}
            </View>
          </DynamicGradientBorder>
        </Pressable>
      </Animated.View>
    );
  });

  5.2 Item de sous-niveau (SubLevelItem)

  interface SubLevelItemProps {
    subLevel: ChallengeSubLevel;
    isCurrent: boolean;
    isCompleted: boolean;
  }

  export const SubLevelItem = memo(function SubLevelItem({
    subLevel,
    isCurrent,
    isCompleted,
  }: SubLevelItemProps) {
    const icon = isCompleted ? 'checkmark-circle' : isCurrent ? 'radio-button-on' : 'ellipse-outline';
    const color = isCompleted ? COLORS.success : isCurrent ? COLORS.primary : COLORS.textMuted;

    return (
      <View style={styles.subLevelItem}>
        <View style={styles.connector} />
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[
          styles.subLevelText,
          isCompleted && styles.subLevelCompleted,
          isCurrent && styles.subLevelCurrent,
        ]}>
          {subLevel.number}. {subLevel.name}
        </Text>
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>EN COURS</Text>
          </View>
        )}
      </View>
    );
  });

  const styles = StyleSheet.create({
    subLevelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING[2],
      paddingVertical: SPACING[2],
      paddingLeft: SPACING[6],
    },
    connector: {
      position: 'absolute',
      left: SPACING[3],
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    subLevelText: {
      flex: 1,
      fontFamily: FONTS.body,
      fontSize: FONT_SIZES.sm,
      color: COLORS.textSecondary,
    },
    subLevelCompleted: {
      color: COLORS.success,
    },
    subLevelCurrent: {
      fontFamily: FONTS.bodySemiBold,
      color: COLORS.white,
    },
    currentBadge: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: SPACING[2],
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
    },
    currentBadgeText: {
      fontFamily: FONTS.bodySemiBold,
      fontSize: FONT_SIZES.xs,
      color: COLORS.background,
    },
  });

  5.3 Badge de secteur

  interface SectorBadgeProps {
    sector: ChallengeSector;
    size?: 'sm' | 'md' | 'lg';
  }

  export const SectorBadge = memo(function SectorBadge({ 
    sector, 
    size = 'md' 
  }: SectorBadgeProps) {
    const sizes = {
      sm: { icon: 14, text: FONT_SIZES.xs, padding: SPACING[1] },
      md: { icon: 18, text: FONT_SIZES.sm, padding: SPACING[2] },
      lg: { icon: 24, text: FONT_SIZES.base, padding: SPACING[3] },
    };

    const s = sizes[size];

    return (
      <View style={[
        styles.badge, 
        { 
          backgroundColor: sector.color + '20',
          paddingHorizontal: s.padding * 1.5,
          paddingVertical: s.padding,
        }
      ]}>
        <Ionicons
          name={sector.iconName as keyof typeof Ionicons.glyphMap}
          size={s.icon}
          color={sector.color}
        />
        <Text style={[styles.badgeText, { fontSize: s.text, color: sector.color }]}>
          {sector.name}
        </Text>
      </View>
    );
  });

  const styles = StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING[2],
      borderRadius: BORDER_RADIUS.lg,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontFamily: FONTS.bodySemiBold,
    },
  });

  5.4 Carte de livrable (DeliverableCard)

  interface DeliverableCardProps {
    type: 'sector_choice' | 'pitch' | 'business_plan_simple' | 'business_plan_full';
    isCompleted: boolean;
    isLocked: boolean;
    data?: any;
    onPress?: () => void;
  }

  export const DeliverableCard = memo(function DeliverableCard({
    type,
    isCompleted,
    isLocked,
    data,
    onPress,
  }: DeliverableCardProps) {
    const config = {
      sector_choice: {
        title: 'Choix du secteur',
        icon: 'leaf-outline',
        level: 1,
      },
      pitch: {
        title: 'Pitch',
        icon: 'megaphone-outline',
        level: 2,
      },
      business_plan_simple: {
        title: 'Business Plan Simplifié',
        icon: 'document-text-outline',
        level: 3,
      },
      business_plan_full: {
        title: 'Business Plan Complet',
        icon: 'briefcase-outline',
        level: 4,
      },
    }[type];

    const statusIcon = isCompleted
      ? 'checkmark-circle'
      : isLocked
      ? 'lock-closed'
      : 'ellipse-outline';

    const statusColor = isCompleted
      ? COLORS.success
      : isLocked
      ? COLORS.textMuted
      : COLORS.textSecondary;

    return (
      <Pressable 
        onPress={!isLocked ? onPress : undefined}
        disabled={isLocked}
      >
        <View style={[styles.card, isLocked && styles.cardLocked]}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={config.icon as keyof typeof Ionicons.glyphMap} 
              size={24} 
              color={isLocked ? COLORS.textMuted : COLORS.primary} 
            />
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, isLocked && styles.titleLocked]}>
              {config.title}
            </Text>
            <Text style={styles.subtitle}>
              {isCompleted
                ? 'Complété'
                : isLocked
                ? `Déblocable au niveau ${config.level}`
                : 'Non commencé'}
            </Text>
          </View>
          <Ionicons name={statusIcon} size={20} color={statusColor} />
        </View>
      </Pressable>
    );
  });

  ---
  6. Modals

  6.1 Structure de modal standard

  import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
  import { BlurView } from 'expo-blur';
  import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';

  interface CustomModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }

  export function CustomModal({ visible, onClose, title, children }: CustomModalProps) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        {/* Overlay avec blur */}
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />

          {/* Contenu du modal */}
          <Animated.View
            entering={SlideInUp.duration(300)}
            exiting={SlideOutDown.duration(300)}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </Pressable>
            </View>

            {/* Body */}
            <View style={styles.body}>
              {children}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: COLORS.overlayDark,
    },
    content: {
      backgroundColor: COLORS.background,
      borderTopLeftRadius: BORDER_RADIUS['3xl'],
      borderTopRightRadius: BORDER_RADIUS['3xl'],
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING[4],
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
    },
    title: {
      fontFamily: FONTS.title,
      fontSize: FONT_SIZES.xl,
      color: COLORS.white,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    body: {
      padding: SPACING[4],
    },
  });

  6.2 Modal de choix de secteur

  interface SectorChoiceModalProps {
    visible: boolean;
    sectors: ChallengeSector[];
    onSelect: (sectorId: string) => void;
    onClose: () => void;
  }

  export function SectorChoiceModal({ 
    visible, 
    sectors, 
    onSelect, 
    onClose 
  }: SectorChoiceModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleConfirm = () => {
      if (selectedId) {
        onSelect(selectedId);
      }
    };

    return (
      <CustomModal visible={visible} onClose={onClose} title="Choisissez votre secteur">
        <Text style={styles.description}>
          Ce choix déterminera le thème de votre parcours pour les niveaux suivants.
        </Text>

        <View style={styles.sectorList}>
          {sectors.map((sector, index) => (
            <Animated.View 
              key={sector.id}
              entering={FadeInDown.delay(100 + index * 80).duration(400)}
            >
              <Pressable onPress={() => setSelectedId(sector.id)}>
                <DynamicGradientBorder
                  borderRadius={BORDER_RADIUS.lg}
                  fill={selectedId === sector.id 
                    ? `${sector.color}20` 
                    : 'rgba(0, 0, 0, 0.25)'}
                >
                  <View style={styles.sectorCard}>
                    <View style={[styles.sectorIcon, { backgroundColor: `${sector.color}20` }]}>
                      <Ionicons
                        name={sector.iconName as keyof typeof Ionicons.glyphMap}
                        size={28}
                        color={sector.color}
                      />
                    </View>
                    <View style={styles.sectorInfo}>
                      <Text style={styles.sectorName}>{sector.name}</Text>
                      <Text style={styles.sectorDesc} numberOfLines={2}>
                        {sector.description}
                      </Text>
                    </View>
                    <View style={[
                      styles.radioOuter,
                      selectedId === sector.id && { borderColor: sector.color }
                    ]}>
                      {selectedId === sector.id && (
                        <View style={[styles.radioInner, { backgroundColor: sector.color }]} />
                      )}
                    </View>
                  </View>
                </DynamicGradientBorder>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <GameButton
          variant="yellow"
          fullWidth
          title="CONFIRMER"
          onPress={handleConfirm}
          disabled={!selectedId}
        />
      </CustomModal>
    );
  }

  ---
  7. Navigation

  7.1 Configuration du layout Challenge

  // src/app/(challenges)/_layout.tsx
  import { Stack } from 'expo-router';
  import { COLORS } from '@/styles/colors';

  export default function ChallengesLayout() {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      />
    );
  }

  7.2 Navigation avec paramètres

  import { useRouter } from 'expo-router';

  const router = useRouter();

  // Navigation simple
  router.push('/(challenges)/challenge-hub');

  // Navigation avec paramètres
  router.push({
    pathname: '/(challenges)/challenge-hub',
    params: { challengeId: 'yeah' },
  });

  // Retour
  router.back();

  // Remplacer (pas de retour possible)
  router.replace('/(tabs)/home');

  7.3 Récupération des paramètres

  import { useLocalSearchParams } from 'expo-router';

  export default function ChallengeHubScreen() {
    const params = useLocalSearchParams<{ challengeId?: string }>();
    const challengeId = params.challengeId || activeChallengeId;

    // ...
  }

  ---
  8. Gestion d'état (Stores)

  8.1 Utilisation du ChallengeStore

  import { useChallengeStore } from '@/stores';

  export default function MyComponent() {
    // Sélecteurs individuels (recommandé pour la performance)
    const challenges = useChallengeStore((state) => state.challenges);
    const enrollments = useChallengeStore((state) => state.enrollments);
    const activeChallengeId = useChallengeStore((state) => state.activeChallengeId);

    // Actions
    const setActiveChallenge = useChallengeStore((state) => state.setActiveChallenge);
    const addXp = useChallengeStore((state) => state.addXp);
    const selectSector = useChallengeStore((state) => state.selectSector);

    // Getters
    const getActiveChallenge = useChallengeStore((state) => state.getActiveChallenge);
    const getActiveEnrollment = useChallengeStore((state) => state.getActiveEnrollment);

    // Données dérivées avec useMemo
    const challenge = useMemo(
      () => challenges.find((c) => c.id === activeChallengeId),
      [challenges, activeChallengeId]
    );

    const enrollment = useMemo(
      () => enrollments.find((e) => e.challengeId === activeChallengeId),
      [enrollments, activeChallengeId]
    );

    // ...
  }

  8.2 Actions principales du ChallengeStore

  // S'inscrire à un Challenge
  enrollInChallenge(challengeId: string, userId: string): ChallengeEnrollment

  // Définir le Challenge actif
  setActiveChallenge(challengeId: string | null)

  // Ajouter des XP
  addXp(enrollmentId: string, amount: number)

  // Sélectionner un secteur
  selectSector(enrollmentId: string, sectorId: string)

  // Vérifier et débloquer le niveau suivant
  checkAndUnlockNextLevel(enrollmentId: string): boolean
  checkAndUnlockNextSubLevel(enrollmentId: string): boolean

  // Sauvegarder un livrable
  savePitch(enrollmentId: string, pitch: NonNullable<ChallengeDeliverables['pitch']>)
  saveBusinessPlan(enrollmentId: string, type: 'simple' | 'full', content: Record<string, string>, document: string)

  // Statut champion (quiz final)
  setChampionStatus(enrollmentId: string, status: ChampionStatus)

  8.3 Pont Jeu ↔ Challenge (ChallengeContext)

  // Défini dans src/types/index.ts
  interface ChallengeContext {
    challengeId: string;
    enrollmentId: string;
    levelNumber: number;
    subLevelNumber: number;
    sectorId: string | null;
  }

  // GameState inclut le champ optionnel:
  interface GameState {
    // ...
    challengeContext?: ChallengeContext;
  }

  // Utilisation dans challenge-game.tsx:
  initGame('solo', edition, gamePlayers, {
    challengeId: challenge.id,
    enrollmentId: enrollment.id,
    levelNumber: enrollment.currentLevel,
    subLevelNumber: enrollment.currentSubLevel,
    sectorId: selectedSector?.id || null,
  });

  // XP Challenge dans results/[gameId].tsx:
  const challengeContext = game?.challengeContext;
  if (isChallengeMode && enrollment) {
    addChallengeXp(enrollment.id, challengeXpGained);
    checkAndUnlockNextSubLevel(enrollment.id);
    checkAndUnlockNextLevel(enrollment.id);
  }

  // Multiplicateurs XP (src/config/progression.ts):
  CHALLENGE_XP_MULTIPLIERS = { 1: x10, 2: x16, 3: x30, 4: x50 }

  8.4 Modes des modals livrables (view/edit)

  Les modals PitchBuilderModal et BusinessPlanModal supportent 3 modes:
  - 'create' : formulaire vierge (défaut)
  - 'view'   : lecture seule avec bouton MODIFIER
  - 'edit'   : formulaire pré-rempli avec données existantes

  // Exemple d'utilisation dans challenge-hub.tsx:
  <PitchBuilderModal
    visible={showPitchModal}
    mode={pitchModalMode}                    // 'create' | 'view' | 'edit'
    initialData={enrollment.deliverables.pitch}  // données existantes
    onClose={() => setShowPitchModal(false)}
    onComplete={handlePitchComplete}
  />

  <BusinessPlanModal
    visible={showBPModal}
    type="simple"
    mode={bpModalMode}
    initialBPData={enrollment.deliverables.businessPlanSimple}
    onClose={() => setShowBPModal(false)}
    onComplete={handleBPComplete}
  />

  ---
  9. Icônes recommandées (Ionicons)

  États et statuts

  - checkmark-circle - Complété
  - radio-button-on - En cours
  - ellipse-outline - Non commencé
  - lock-closed - Verrouillé

  Navigation

  - arrow-back - Retour
  - chevron-down / chevron-up - Expand/Collapse
  - chevron-forward - Suivant

  Challenge

  - school-outline - Programme/Challenge
  - trophy-outline - Récompense/Champion
  - star-outline - Niveau/XP
  - navigate-outline - Sous-niveau en cours

  Secteurs (exemples)

  - leaf-outline - Agriculture/Végétal
  - paw-outline - Élevage
  - construct-outline - Transformation
  - settings-outline - Services

  Actions

  - play - Jouer/Lancer
  - game-controller - Mode solo
  - people - Mode multijoueur
  - hardware-chip - IA

  Livrables

  - document-text-outline - Document
  - megaphone-outline - Pitch
  - briefcase-outline - Business Plan

  ---
  10. Checklist pour nouveaux écrans

  Avant de coder

  - Définir la route dans _layout.tsx
  - Ajouter les types dans RootStackParamList
  - Identifier les données nécessaires (stores)
  - Sketcher la structure UI

  Pendant le développement

  - Importer RadialBackground
  - Utiliser useSafeAreaInsets pour les marges
  - Appliquer les styles de COLORS, FONTS, SPACING
  - Utiliser DynamicGradientBorder pour les cartes
  - Ajouter les animations entering sur les éléments
  - Mémoriser les composants avec memo()
  - Utiliser useMemo et useCallback pour les performances

  Après le développement

  - Tester sur iOS et Android
  - Vérifier les animations
  - Vérifier la navigation (retour, params)
  - Tester avec différentes tailles d'écran
  - Vérifier la compilation TypeScript (npx tsc --noEmit)

  ---
  11. Exemples de code complets

  Voir les fichiers existants pour référence :

  Écrans:
  - src/app/(challenges)/[challengeId].tsx   - Détail programme (avec animations premium)
  - src/app/(challenges)/challenge-hub.tsx    - Hub progression (niveaux, livrables, play)
  - src/app/(challenges)/my-programs.tsx      - Liste des programmes inscrits
  - src/app/(game)/challenge-game.tsx         - Config partie Challenge (solo vs IA)

  Composants:
  - src/components/challenges/ChallengeHomeCard.tsx   - Carte accueil (inscrit/non inscrit)
  - src/components/challenges/SectorChoiceModal.tsx   - Carousel choix secteur
  - src/components/challenges/PitchBuilderModal.tsx   - Formulaire pitch 5 étapes (create/view/edit)
  - src/components/challenges/BusinessPlanModal.tsx    - BP simple/complet (create/view/edit)
  - src/components/challenges/FinalQuizModal.tsx       - Quiz final 16 questions + certificat champion

  Données:
  - src/data/challenges/yeah.ts               - Config YEAH (4 niveaux, 4 secteurs, 16 sous-niveaux)
  - src/data/challenges/quizQuestions.ts       - Questions quiz final + seuil 75%

  Types & Store:
  - src/types/challenge.ts                    - Interfaces Challenge (17 types + helpers)
  - src/types/index.ts                        - ChallengeContext (pont jeu ↔ programme)
  - src/stores/useChallengeStore.ts           - État Challenge (Zustand + immer + persist)
  - src/config/progression.ts                 - Multiplicateurs XP Challenge (x10→x50)

  Intégration jeu:
  - src/app/(game)/results/[gameId].tsx       - Attribution XP Challenge + unlock niveaux

  ---
  12. Flux utilisateur complet

  1. Home → ChallengeHomeCard (non inscrit) → [challengeId].tsx (détail) → enrollInChallenge()
  2. → challenge-hub.tsx (hub) → Jouer → challenge-game.tsx → play/[gameId] → results/[gameId]
  3. results : addChallengeXp() → checkAndUnlockNextSubLevel() → checkAndUnlockNextLevel()
  4. hub : Livrables débloqués selon le niveau:
     - Niveau 1 : SectorChoiceModal (choix secteur définitif)
     - Niveau 2 : PitchBuilderModal (formulaire 5 étapes)
     - Niveau 3 : BusinessPlanModal type='simple' (4 questions)
     - Niveau 4 : BusinessPlanModal type='full' (4 questions supplémentaires) + FinalQuizModal
  5. Livrables complétés : consultables et éditables via mode 'view'/'edit'
  6. Quiz final réussi → ChampionStatus (local/regional/national) + certificat

  ---
  Cette fiche technique doit être mise à jour à chaque évolution majeure du design system.