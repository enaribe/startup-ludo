import { memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FONTS } from '@/styles/typography';
import { DynamicGradientBorder } from './GradientBorder';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatCardProps {
  value: string;
  label: string;
  valueColor?: string;
  columns?: number;
  gap?: number;
}

export const StatCard = memo(function StatCard({
  value,
  label,
  valueColor = '#FFBC40',
  columns = 2,
  gap = 12,
}: StatCardProps) {
  const cardWidth = (SCREEN_WIDTH - 36 - gap * (columns - 1)) / columns;

  return (
    <DynamicGradientBorder
      boxWidth={cardWidth}
      borderRadius={16}
      fill="rgba(0, 0, 0, 0.25)"
      style={{ flex: 1 }}
    >
      <View style={styles.content}>
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </DynamicGradientBorder>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: FONTS.title,
    fontSize: 26,
    marginBottom: 4,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
});
