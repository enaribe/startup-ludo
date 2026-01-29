import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '@/styles/typography';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  rightElement?: React.ReactNode;
}

export const ScreenHeader = memo(function ScreenHeader({
  title,
  subtitle,
  subtitleColor = '#FFBC40',
  rightElement,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    marginTop: 4,
  },
});
