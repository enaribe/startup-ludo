import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>Oups !</Text>

            <Text style={styles.message}>
              Une erreur inattendue s'est produite.
            </Text>

            {/* Error Message */}
            {this.state.error && (
              <View style={styles.errorBlock}>
                <Text style={styles.errorLabel}>Message d'erreur :</Text>
                <Text style={styles.errorText}>
                  {this.state.error.message || 'Erreur inconnue'}
                </Text>
              </View>
            )}

            {/* Error Stack */}
            {this.state.error?.stack && (
              <View style={styles.errorBlock}>
                <Text style={styles.errorLabel}>Stack trace :</Text>
                <ScrollView
                  horizontal
                  style={styles.stackScrollView}
                  nestedScrollEnabled
                >
                  <Text style={styles.stackText}>
                    {this.state.error.stack}
                  </Text>
                </ScrollView>
              </View>
            )}

            {/* Component Stack (Dev only) */}
            {__DEV__ && this.state.errorInfo?.componentStack && (
              <View style={styles.errorBlock}>
                <Text style={styles.errorLabel}>Component Stack :</Text>
                <ScrollView
                  horizontal
                  style={styles.stackScrollView}
                  nestedScrollEnabled
                >
                  <Text style={styles.stackText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </ScrollView>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title="Réessayer"
                variant="primary"
                onPress={this.handleReset}
              />
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING[6],
    paddingTop: SPACING[12],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.error,
    marginBottom: SPACING[4],
    textAlign: 'center',
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING[6],
    textAlign: 'center',
  },
  errorBlock: {
    marginBottom: SPACING[5],
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 54, 0.2)',
  },
  errorLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginBottom: SPACING[2],
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  stackScrollView: {
    maxHeight: 200,
  },
  stackText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  buttonContainer: {
    marginTop: SPACING[6],
    alignItems: 'center',
  },
});
