import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { DynamicGradientBorder } from '@/components/ui/GradientBorder';
import { useTranslation } from '@/i18n';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

interface GuestPromoBannerProps {
  onDismiss: () => void;
}

export function GuestPromoBanner({ onDismiss }: GuestPromoBannerProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleCreateAccount = () => {
    router.push('/(auth)/register');
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      exiting={FadeOutUp.duration(200)}
      style={styles.wrapper}
    >
      <DynamicGradientBorder borderRadius={14} fill="rgba(255, 188, 64, 0.12)">
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="person-add" size={20} color="#FFBC40" />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{t('guestBanner.title')}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {t('guestBanner.desc')}
            </Text>
          </View>
          <Pressable
            style={styles.cta}
            onPress={handleCreateAccount}
            hitSlop={8}
          >
            <Text style={styles.ctaText}>{t('guestBanner.cta')}</Text>
          </Pressable>
          <Pressable
            style={styles.closeBtn}
            onPress={onDismiss}
            hitSlop={10}
          >
            <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.6)" />
          </Pressable>
        </View>
      </DynamicGradientBorder>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 188, 64, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 13,
    color: '#FFBC40',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
    lineHeight: 15,
  },
  cta: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFBC40',
  },
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: '#0A1929',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
