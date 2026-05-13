export const colors = {
  // Backgrounds
  bg:        '#080C18',
  bgCard:    '#0D1426',
  bgCardAlt: '#111A30',
  border:    '#1E2D50',
  borderLight: '#2A3F6B',

  // Brand
  primary:   '#00D4FF',
  primaryDim: '#0099BB',
  accent:    '#7C5CFC',

  // Status
  good:      '#00E676',
  goodDim:   '#00C853',
  warning:   '#FFB300',
  warningDim:'#E65100',
  critical:  '#FF1744',
  criticalDim:'#B71C1C',

  // Text
  text:      '#F0F4FF',
  textSub:   '#8A9BC4',
  textMuted: '#4A5A80',

  // Misc
  white:     '#FFFFFF',
  online:    '#00E676',
  offline:   '#FF1744',
  motor:     '#FF6D00',
};

export const fonts = {
  regular: 400,
  medium:  500,
  semibold: 600,
  bold:    700,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  }),
};
