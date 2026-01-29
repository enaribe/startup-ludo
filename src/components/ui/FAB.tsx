import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  colors?: [string, string];
  bottom?: number;
  right?: number;
  size?: number;
}

export const FAB = memo(function FAB({
  onPress,
  icon = 'add',
  iconSize = 32,
  iconColor = '#0C243E',
  colors = ['#FFBC40', '#F5A623'],
  bottom = 100,
  right = 18,
  size = 56,
}: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.fab,
        {
          bottom,
          right,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <LinearGradient colors={colors} style={styles.gradient}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#FFBC40',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
