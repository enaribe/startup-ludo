import { memo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal as RNModal,
  type ModalProps as RNModalProps,
  type ViewStyle,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING, Z_INDEX } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ModalSize = 'sm' | 'md' | 'lg' | 'full';

interface ModalProps extends Omit<RNModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  containerStyle?: ViewStyle;
}

const SIZE_STYLES: Record<ModalSize, ViewStyle> = {
  sm: {
    maxWidth: 320,
    width: '85%',
  },
  md: {
    maxWidth: 400,
    width: '90%',
  },
  lg: {
    maxWidth: 500,
    width: '95%',
  },
  full: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
};

export const Modal = memo(function Modal({
  visible,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  children,
  footer,
  containerStyle,
  ...props
}: ModalProps) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      contentScale.value = withSpring(1, { damping: 20, stiffness: 300 });
      contentOpacity.value = withTiming(1, { duration: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      contentScale.value = withTiming(0.9, {
        duration: 150,
        easing: Easing.out(Easing.ease),
      });
      contentOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, backdropOpacity, contentScale, contentOpacity]);

  const handleBackdropPress = useCallback(() => {
    if (closeOnBackdrop) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
    opacity: contentOpacity.value,
  }));

  const isFullSize = size === 'full';

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      {...props}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, zIndex: Z_INDEX.modal }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: isFullSize ? 'flex-start' : 'center',
            alignItems: 'center',
          }}
        >
          {/* Backdrop */}
          <AnimatedPressable
            onPress={handleBackdropPress}
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: COLORS.overlay,
                zIndex: Z_INDEX.modalBackdrop,
              },
              backdropAnimatedStyle,
            ]}
          />

          {/* Content */}
          <Animated.View
            style={[
              {
                backgroundColor: COLORS.background,
                borderRadius: BORDER_RADIUS['2xl'],
                maxHeight: isFullSize ? '100%' : SCREEN_HEIGHT * 0.85,
                zIndex: Z_INDEX.modal,
                overflow: 'hidden',
              },
              SIZE_STYLES[size],
              !isFullSize && {
                marginHorizontal: SPACING[4],
              },
              isFullSize && {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
              },
              contentAnimatedStyle,
              containerStyle,
            ]}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: SPACING[5],
                  paddingTop: SPACING[5],
                  paddingBottom: SPACING[3],
                }}
              >
                {title ? (
                  <Text
                    style={{
                      fontFamily: FONTS.title,
                      fontSize: FONT_SIZES.xl,
                      color: COLORS.text,
                      flex: 1,
                    }}
                  >
                    {title}
                  </Text>
                ) : (
                  <View />
                )}

                {showCloseButton && (
                  <Pressable
                    onPress={onClose}
                    hitSlop={8}
                    style={{
                      padding: SPACING[2],
                      marginLeft: SPACING[2],
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={COLORS.textSecondary}
                    />
                  </Pressable>
                )}
              </View>
            )}

            {/* Body */}
            <View
              style={{
                flex: isFullSize ? 1 : undefined,
                paddingHorizontal: SPACING[5],
                paddingBottom: footer ? 0 : SPACING[5],
              }}
            >
              {children}
            </View>

            {/* Footer */}
            {footer && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: COLORS.border,
                  paddingHorizontal: SPACING[5],
                  paddingVertical: SPACING[4],
                }}
              >
                {footer}
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
});
