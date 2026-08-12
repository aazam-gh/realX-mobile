type WindowSizeClass = 'compact' | 'medium' | 'expanded';

function getWindowSizeClass(width: number): WindowSizeClass {
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
