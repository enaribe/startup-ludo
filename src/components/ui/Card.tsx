import { memo } from 'react';
import { View, type ViewStyle, type ViewProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/styles/spacing';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'transparent';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: keyof typeof SPACING;
  borderRadius?: keyof typeof BORDER_RADIUS;
  animated?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  elevated: {
    backgroundColor: COLORS.card,
    ...SHADOWS.lg,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
};

export const Card = memo(function Card({
  variant = 'default',
  padding = 4,
  borderRadius = 'xl',
  animated = false,
  children,
  style,
  ...props
}: CardProps) {
  const containerStyle: ViewStyle = {
    ...VARIANT_STYLES[variant],
    padding: SPACING[padding],
    borderRadius: BORDER_RADIUS[borderRadius],
    overflow: 'hidden',
  };

  if (animated) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={[containerStyle, style]}
        {...props}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <View style={[containerStyle, style]} {...props}>
      {children}
    </View>
  );
});

// Card subcomponents
interface CardHeaderProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader = memo(function CardHeader({
  children,
  style,
  ...props
}: CardHeaderProps) {
  return (
    <View
      style={[
        {
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          paddingBottom: SPACING[3],
          marginBottom: SPACING[3],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
});

interface CardContentProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent = memo(function CardContent({
  children,
  style,
  ...props
}: CardContentProps) {
  return (
    <View style={[{ flex: 1 }, style]} {...props}>
      {children}
    </View>
  );
});

interface CardFooterProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardFooter = memo(function CardFooter({
  children,
  style,
  ...props
}: CardFooterProps) {
  return (
    <View
      style={[
        {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: SPACING[3],
          marginTop: SPACING[3],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
});
