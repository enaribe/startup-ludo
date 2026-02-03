export const COLORS = {
  // Primary colors
  primary: '#FFBC40',
  primaryLight: '#FFD580',
  primaryDark: '#CC9633',

  // Background
  background: '#0C243E',
  backgroundLight: '#194F8A',
  backgroundGradient: ['#0C243E', '#194F8A', '#0C243E'] as const,

  // Text
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',

  // Card
  card: 'rgba(0, 0, 0, 0.3)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',

  // Player colors
  players: {
    yellow: '#FFBC40',
    blue: '#1F91D0',
    green: '#4CAF50',
    red: '#F35145',
  } as const,

  // Event colors
  events: {
    quiz: '#4A90E2',
    funding: '#50C878',
    duel: '#FF6B6B',
    opportunity: '#FFB347',
    challenge: '#9B59B6',
    safe: '#95A5A6',
    start: '#2ECC71',
    finish: '#E74C3C',
  } as const,

  // Status colors
  success: '#4CAF50',
  successLight: 'rgba(76, 175, 80, 0.2)',
  error: '#F44336',
  errorLight: 'rgba(244, 67, 54, 0.2)',
  warning: '#FF9800',
  warningLight: 'rgba(255, 152, 0, 0.2)',
  info: '#2196F3',
  infoLight: 'rgba(33, 150, 243, 0.2)',

  // Surface variants
  surface: 'rgba(255, 255, 255, 0.05)',
  surfaceVariant: 'rgba(255, 255, 255, 0.1)',

  // UI colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  // Border colors
  border: 'rgba(255, 255, 255, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.1)',

  // Disabled
  disabled: 'rgba(255, 255, 255, 0.3)',
  disabledBackground: 'rgba(0, 0, 0, 0.2)',
} as const;

export type ColorKey = keyof typeof COLORS;
export type PlayerColorKey = keyof typeof COLORS.players;
export type EventColorKey = keyof typeof COLORS.events;
