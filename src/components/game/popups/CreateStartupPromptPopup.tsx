/**
 * CreateStartupPromptPopup — Incite le joueur à créer sa première startup.
 * Affiché périodiquement tant que le joueur n'a pas de startup (profile.startups.length === 0).
 * Basé sur GamePopup (design system).
 */

import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { RocketIcon } from '@/components/icons';
import { GameButton } from '@/components/ui/GameButton';
import { GamePopup, GAME_POPUP_WIDTH } from '@/components/ui/GamePopup';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

// ─── Image cartes d'inspiration ──────────────────────────────────────────────

function InspirationCards() {
  return (
    <Image
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('../../../../assets/images/ideationcard.png')}
      style={styles.ideationCardImage}
      resizeMode="contain"
    />
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface CreateStartupPromptPopupProps {
  visible: boolean;
  onCreateStartup: () => void;
  onDismiss: () => void;
}

export const CreateStartupPromptPopup = memo(function CreateStartupPromptPopup({
  visible,
  onCreateStartup,
  onDismiss,
}: CreateStartupPromptPopupProps) {
  return (
    <GamePopup
      visible={visible}
      onRequestClose={onDismiss}
      header="Nouvelle Startup"
      icon={<RocketIcon color="#1F91D0" size={64} withShadow={false} />}
    >
      {/* Titre avec stroke bleu */}
      <View style={styles.titleWrapper}>
        <OutlinedText
          text={"CRÉEZ VOTRE STARTUP\nAVANT DE JOUER !"}
          style={styles.title}
          outlineColor="#1F91D0"
          outlineWidth={1.5}
        />
      </View>

      {/* Description */}
      <Text style={styles.description}>
        Tirez 3 cartes d'inspiration et imaginez la prochaine licorne ouest-africaine en 5 minutes
      </Text>

      {/* Cartes d'inspiration */}
      <InspirationCards />

      {/* Légende cartes */}
      <Text style={styles.cardsCaption}>Vos 3 cartes d'inspiration</Text>

      {/* Bouton principal */}
      <View style={styles.buttonWrapper}>
        <GameButton
          variant="yellow"
          fullWidth
          title="CRÉER MA STARTUP"
          onPress={onCreateStartup}
        />
      </View>
    </GamePopup>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  titleWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[4],
    paddingHorizontal: SPACING[2],
  },
  ideationCardImage: {
    width: GAME_POPUP_WIDTH - SPACING[5] * 2,
    height: 110,
    marginBottom: SPACING[2],
  },
  cardsCaption: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[4],
  },
  buttonWrapper: {
    width: '100%',
  },
});
