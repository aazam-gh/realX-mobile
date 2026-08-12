import { useWindowDimensions } from 'react-native';

export type WindowSizeClass = 'compact' | 'medium' | 'expanded';

export function getWindowSizeClass(width: number): WindowSizeClass {
  if (width < 600) return 'compact';
  if (width < 840) return 'medium';
  return 'expanded';
}

export function getGridColumns(width: number, compactColumns = 2): number {
  const sizeClass = getWindowSizeClass(width);
  if (sizeClass === 'expanded') return 4;
  if (sizeClass === 'medium') return 3;
  return compactColumns;
}

export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const sizeClass = getWindowSizeClass(width);

  return {
    width,
    height,
    fontScale,
    sizeClass,
    isCompact: sizeClass === 'compact',
    isMedium: sizeClass === 'medium',
    isExpanded: sizeClass === 'expanded',
    contentMaxWidth: sizeClass === 'expanded' ? 1180 : sizeClass === 'medium' ? 820 : undefined,
    horizontalPadding: sizeClass === 'expanded' ? 40 : sizeClass === 'medium' ? 28 : 16,
  } as const;
}
