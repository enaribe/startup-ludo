/**
 * AdBanner - Banniere publicitaire pour l'ecran d'accueil
 * Affiche une image pub geree depuis l'admin
 */

import { memo } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientBorder } from '@/components/ui/GradientBorder';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

interface AdBannerProps {
  /** URL de l'image publicitaire */
  imageUrl?: string;
  /** URL de redirection au clic */
  linkUrl?: string;
  /** Callback personnalise au clic */
  onPress?: () => void;
  /** Afficher un placeholder si pas d'image */
  showPlaceholder?: boolean;
}

export const AdBanner = memo(function AdBanner({
  imageUrl,
  linkUrl,
  onPress,
  showPlaceholder = false,
}: AdBannerProps) {
  // Si pas d'image et pas de placeholder, ne rien afficher
  if (!imageUrl && !showPlaceholder) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (linkUrl) {
      Linking.openURL(linkUrl).catch(() => {
        // Ignorer les erreurs d'ouverture de lien
      });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      disabled={!imageUrl && !linkUrl && !onPress}
    >
      <GradientBorder
        boxHeight={120}
        borderRadius={16}
        fill="rgba(0, 0, 0, 0.25)"
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="megaphone-outline" size={32} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.placeholderText}>Espace publicitaire</Text>
          </View>
        )}
      </GradientBorder>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING[5],
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING[2],
  },
  placeholderText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
