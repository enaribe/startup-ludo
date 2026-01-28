import { memo } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState = memo(function EmptyState({
  icon = 'document-text-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING[6],
        },
        style,
      ]}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: COLORS.card,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: SPACING[4],
        }}
      >
        <Ionicons
          name={icon}
          size={40}
          color={COLORS.textSecondary}
        />
      </View>

      <Text
        style={{
          fontFamily: FONTS.title,
          fontSize: FONT_SIZES.xl,
          color: COLORS.text,
          textAlign: 'center',
          marginBottom: SPACING[2],
        }}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: FONT_SIZES.base,
            color: COLORS.textSecondary,
            textAlign: 'center',
            maxWidth: 280,
            marginBottom: SPACING[4],
          }}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          variant="primary"
          onPress={onAction}
        />
      )}
    </View>
  );
});
