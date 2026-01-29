import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '@/styles/typography';

interface TagProps {
  label: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

export const Tag = memo(function Tag({
  label,
  color = 'rgba(255,255,255,0.6)',
  bgColor = 'rgba(255,255,255,0.08)',
  borderColor = 'rgba(255,255,255,0.1)',
}: TagProps) {
  return (
    <View style={[styles.tag, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
  },
});
