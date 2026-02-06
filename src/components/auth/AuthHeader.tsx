/**
 * AuthHeader - Header pour les écrans d'authentification
 * Avec background, bouton retour et logo centré
 */

import { memo } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBorder } from '@/components/ui/GradientBorder';
import { SPACING } from '@/styles/spacing';
const logoImage = require('@/../assets/images/logostartupludo.png');

interface AuthHeaderProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

export const AuthHeader = memo(function AuthHeader({
  onBack,
  showBackButton = true,
}: AuthHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + SPACING[3] }]}>
      {/* Back Button */}
      {showBackButton && onBack ? (
        <Pressable onPress={onBack} style={styles.backButton}>
          <GradientBorder boxHeight={44} boxWidth={44} borderRadius={22} fill="rgba(0, 0, 0, 0.2)">
            <View style={styles.backButtonContent}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </View>
          </GradientBorder>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      {/* Logo Centré */}
      <Image
        source={logoImage}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Placeholder pour équilibrer */}
      <View style={styles.placeholder} />
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  backButtonContent: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  logo: {
    width: 100,
    height: 50,
  },
});
