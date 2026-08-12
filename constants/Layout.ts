export const LayoutTokens = {
  touchTarget: 48,
  touchTargetCompact: 44,
  radius: {
    small: 12,
    medium: 16,
    large: 24,
    capsule: 999,
  },
  elevation: {
    none: undefined,
    low: '0 1px 3px rgba(0,0,0,0.10)',
    medium: '0 3px 10px rgba(0,0,0,0.14)',
  },
} as const;

export const SemanticSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
