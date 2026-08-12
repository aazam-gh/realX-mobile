import type { ReactNode } from 'react';
import { Pressable, type AccessibilityState, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { LayoutTokens } from '../constants/Layout';
import { triggerSubtleHaptic } from '../utils/haptics';

type AccessiblePressableProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  haptic?: boolean;
};

export default function AccessiblePressable({
  children,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  haptic = true,
  onPress,
  ...props
}: AccessiblePressableProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      onPress={(event) => {
        if (haptic) triggerSubtleHaptic();
        onPress?.(event);
      }}
      style={({ pressed }) => [
        { minWidth: LayoutTokens.touchTarget, minHeight: LayoutTokens.touchTarget, opacity: pressed ? 0.78 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
