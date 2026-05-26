export const Colors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F2EE',
  text: '#2B2B2B',
  textSecondary: '#6B6460',
  textMuted: '#9B9490',
  brand: '#C9A86A',
  brandLight: '#E8D5A8',
  brandDark: '#A07840',
  border: '#E8E2D8',
  borderLight: '#F0EBE3',

  // Semantic colors — avoid harsh red/green
  savingGreen: '#5A8A6A',
  savingGreenLight: '#E8F4EC',
  expensiveOrange: '#C4703A',
  expensiveOrangeLight: '#FAEEE6',

  tabBar: '#FAF8F5',
  tabBarBorder: '#E8E2D8',
  tabActive: '#C9A86A',
  tabInactive: '#9B9490',

  shadow: 'rgba(43, 43, 43, 0.08)',
};

export const Typography = {
  // Heading — Noto Serif TC for warmth and quality feel
  headingFamily: 'NotoSerifTC_600SemiBold',
  // Body — Noto Sans TC for readability
  bodyFamily: 'NotoSansTC_400Regular',
  bodyMediumFamily: 'NotoSansTC_500Medium',
  bodyBoldFamily: 'NotoSansTC_700Bold',
  // Monospace — for prices and token numbers
  monoFamily: 'SpaceMono_400Regular',

  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  lineHeights: {
    tight: 1.3,
    normal: 1.6,
    relaxed: 1.8,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};
