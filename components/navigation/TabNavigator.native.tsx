import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { createBottomTabNavigator } from 'expo-router/js-tabs';
import { withLayoutContext } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
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
        backgroundColor={theme.surface}
        disableTransparentOnScrollEdge
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
      screenOptions={{
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.iconMuted,
        tabBarStyle: {
          display: isTabBarVisible ? 'flex' : 'none',
          backgroundColor: 'transparent',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 37, 23, 0.10)',
          borderTopWidth: StyleSheet.hairlineWidth,
          boxShadow: isDark
            ? '0 -8px 20px rgba(0, 0, 0, 0.18)'
            : '0 -8px 20px rgba(15, 37, 23, 0.08)',
        },
        tabBarBackground: () => (
          <>
            <BlurView
              blurMethod="dimezisBlurViewSdk31Plus"
              blurReductionFactor={3}
              intensity={72}
              tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
              style={StyleSheet.absoluteFill}
            />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? 'rgba(14, 19, 16, 0.20)' : 'rgba(255, 255, 255, 0.26)' },
              ]}
            />
          </>
        ),
      }}
    >
      {(isRTL ? [...screens].reverse() : screens).map((screen) => (
        <JSTabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            headerShown: false,
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
      <JSTabs.Screen name="map" options={{ headerShown: false, tabBarButton: () => null }} />
      <JSTabs.Screen name="wallet" options={{ headerShown: false, tabBarButton: () => null }} />
    </JSTabs>
  );
}
