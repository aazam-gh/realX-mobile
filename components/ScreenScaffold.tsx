import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { useAppTheme } from '../context/AppThemeContext';
import { useResponsiveLayout } from '../utils/responsive';

type ScreenScaffoldProps = {
  children: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  statusBarHidden?: boolean;
  statusBarStyle?: 'auto' | 'inverted' | 'light' | 'dark';
  testID?: string;
};

export function ScreenScaffold({
  children,
  edges = ['top', 'bottom'],
  style,
  contentStyle,
  statusBarHidden = false,
  statusBarStyle,
  testID,
}: ScreenScaffoldProps) {
  const { isDark, theme } = useAppTheme();
  const { contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView testID={testID} edges={edges} style={[styles.root, { backgroundColor: theme.background }, style]}>
      <StatusBar hidden={statusBarHidden} style={statusBarStyle ?? (isDark ? 'light' : 'dark')} animated />
      <View
        style={[
          styles.content,
          { paddingHorizontal: horizontalPadding, paddingBottom: Math.max(insets.bottom, 0) },
          contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : null,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
