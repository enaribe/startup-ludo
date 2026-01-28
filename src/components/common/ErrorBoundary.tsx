import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING[6],
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.error,
              marginBottom: SPACING[4],
              textAlign: 'center',
            }}
          >
            Oups !
          </Text>

          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.md,
              color: COLORS.text,
              marginBottom: SPACING[2],
              textAlign: 'center',
            }}
          >
            Une erreur inattendue s'est produite.
          </Text>

          {__DEV__ && this.state.error && (
            <Text
              style={{
                fontFamily: FONTS.mono,
                fontSize: FONT_SIZES.sm,
                color: COLORS.textSecondary,
                marginTop: SPACING[4],
                marginBottom: SPACING[6],
                textAlign: 'center',
                backgroundColor: COLORS.card,
                padding: SPACING[3],
                borderRadius: 8,
                maxWidth: '100%',
              }}
            >
              {this.state.error.message}
            </Text>
          )}

          <Button
            title="Réessayer"
            variant="primary"
            onPress={this.handleReset}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
