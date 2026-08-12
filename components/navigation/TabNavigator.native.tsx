import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from 'expo-router/js-tabs';
import { withLayoutContext } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { TabBarVisibilityProvider, useTabBarVisibilityContext } from './TabBarScrollVisibility';

const JSTabs = withLayoutContext(
  createBottomTabNavigator().Navigator,
  undefined,
  true,
);

export default function TabNavigator() {
  return (
    <TabBarVisibilityProvider>
      <TabNavigatorContent />
    </TabBarVisibilityProvider>
  );
}

function TabNavigatorContent() {
  const { t } = useTranslation();
  const { isDark, theme } = useAppTheme();
  const { isRTL } = useAppLocale();
  const { isTabBarVisible } = useTabBarVisibilityContext();
  const insets = useSafeAreaInsets();
  const isIos = Platform.OS === 'ios';
  const screens = [
    { name: 'index', title: t('home'), iosIcon: 'house', icon: 'home', outlineIcon: 'home-outline' },
    { name: 'explore', title: t('explore'), iosIcon: 'safari.fill', icon: 'compass', outlineIcon: 'compass-outline' },
    { name: 'rewards', title: t('wallet'), iosIcon: 'creditcard.fill', icon: 'card', outlineIcon: 'card-outline' },
    { name: 'profile', title: t('profile'), iosIcon: 'person.fill', icon: 'person', outlineIcon: 'person-outline' },
  ];

  if (isIos) {
    return (
      <NativeTabs
        tintColor={theme.brand}
        minimizeBehavior="onScrollDown"
      >
        {(isRTL ? [...screens].reverse() : screens).map((screen) => (
          <NativeTabs.Trigger key={screen.name} name={screen.name}>
            <NativeTabs.Trigger.Label>{screen.title}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={screen.iosIcon as any} />
          </NativeTabs.Trigger>
        ))}
        <NativeTabs.Trigger name="map" hidden />
        <NativeTabs.Trigger name="wallet" hidden />
      </NativeTabs>
    );
  }

  return (
    <JSTabs
      safeAreaInsets={{ top: 0, right: insets.right, bottom: insets.bottom, left: insets.left }}
      screenListeners={{
        tabPress: () => {
          requestAnimationFrame(triggerSubtleHaptic);
        },
      }}
      screenOptions={{
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.iconMuted,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          display: isTabBarVisible ? 'flex' : 'none',
          backgroundColor: theme.surface,
          height: 64 + insets.bottom,
          paddingTop: 4,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingHorizontal: 8,
          boxShadow: isDark
            ? '0 -2px 8px rgba(0,0,0,0.28)'
            : '0 -2px 8px rgba(15,37,23,0.10)',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 37, 23, 0.10)',
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarHideOnKeyboard: false,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
      }}
    >
      {(isRTL ? [...screens].reverse() : screens).map((screen) => (
        <JSTabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            headerShown: false,
            tabBarButton: AndroidTabBarButton,
            tabBarIcon: (props: any) => (
              <Ionicons
                name={(props.focused ? screen.icon : screen.outlineIcon) as any}
                size={24}
                color={props.color}
              />
            ),
          }}
        />
      ))}
      <JSTabs.Screen
        name="map"
        options={{ href: null, headerShown: false, tabBarButton: () => null, tabBarItemStyle: styles.hiddenTabItem }}
      />
      <JSTabs.Screen
        name="wallet"
        options={{ href: null, headerShown: false, tabBarButton: () => null, tabBarItemStyle: styles.hiddenTabItem }}
      />
    </JSTabs>
  );
}

function AndroidTabBarButton(props: any) {
  const { isDark, theme } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const {
    children,
    onPress,
    onLongPress,
    testID,
    style,
    href: _href,
    ['aria-label']: ariaLabel,
    ['aria-selected']: ariaSelected,
    ...pressableProps
  } = props;
  const isSelected = Boolean(ariaSelected);
  const selectionProgress = useSharedValue(isSelected ? 1 : 0);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      selectionProgress.value = isSelected ? 1 : 0;
      return;
    }

    selectionProgress.value = withSpring(isSelected ? 1 : 0, {
      damping: 18,
      stiffness: 240,
      mass: 0.7,
      overshootClamping: false,
    });
  }, [isSelected, reduceMotion, selectionProgress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: selectionProgress.value,
    transform: [
      { scaleX: 0.72 + selectionProgress.value * 0.28 },
      { scaleY: 0.84 + selectionProgress.value * 0.16 },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: selectionProgress.value * -1.5 },
      { scale: 1 + selectionProgress.value * 0.035 - pressProgress.value * 0.045 },
    ],
  }));

  const handlePressIn = () => {
    if (!reduceMotion) {
      pressProgress.value = withTiming(1, { duration: 90 });
    }
  };

  const handlePressOut = () => {
    if (!reduceMotion) {
      pressProgress.value = withSpring(0, { damping: 17, stiffness: 300, mass: 0.6 });
    }
  };

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="tab"
      accessibilityLabel={ariaLabel}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
      style={[style as StyleProp<ViewStyle>, styles.tabBarButton]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tabSelectionIndicator,
          { backgroundColor: isDark ? 'rgba(24, 184, 82, 0.18)' : theme.brandSoft },
          indicatorStyle,
        ]}
      />
      <Animated.View pointerEvents="none" style={[styles.tabBarButtonContent, contentStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 22,
  },
  tabBarButton: {
    minHeight: 48,
    borderRadius: 22,
    overflow: 'hidden',
  },
  tabSelectionIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 22,
  },
  tabBarButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 1,
  },
  hiddenTabItem: {
    display: 'none',
  },
});
