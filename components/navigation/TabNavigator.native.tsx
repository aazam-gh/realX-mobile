import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { createBottomTabNavigator } from 'expo-router/js-tabs';
import { withLayoutContext } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';

const NativeTabs = withLayoutContext(createNativeBottomTabNavigator().Navigator);
const JSTabs = withLayoutContext(createBottomTabNavigator().Navigator);

export default function TabNavigator() {
  const { t } = useTranslation();
  const { isDark, theme } = useAppTheme();
  const { direction, isRTL } = useAppLocale();
  const Tabs = Platform.OS === 'ios' ? NativeTabs : JSTabs;
  const isIos = Platform.OS === 'ios';
  const screens = [
    { name: 'index', title: t('home'), iosIcon: 'house', icon: 'home', outlineIcon: 'home-outline' },
    { name: 'map', title: t('map'), iosIcon: 'map.fill', icon: 'map', outlineIcon: 'map-outline' },
    { name: 'wallet', title: t('wallet'), iosIcon: 'creditcard.fill', icon: 'card', outlineIcon: 'card-outline' },
    { name: 'profile', title: t('profile'), iosIcon: 'person.fill', icon: 'person', outlineIcon: 'person-outline' },
  ];

  return (
    <Tabs
      {...(isIos ? {
        layoutDirection: direction,
        minimizeBehavior: 'onScrollDown',
      } : {})}
      screenOptions={{
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.iconMuted,
        ...(isIos ? {
          // Keep the native controls, but use an opaque surface so tab
          // navigation remains visually distinct from scrolling content.
          translucent: false,
        } : {
          tabBarStyle: {
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
        }),
      } as any}
    >
      {(isIos || !isRTL ? screens : [...screens].reverse()).map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            headerShown: false,
            tabBarIcon: (props: any) => isIos
              ? ({ sfSymbol: screen.iosIcon } as any)
              : (
                <Ionicons
                  name={(props.focused ? screen.icon : screen.outlineIcon) as any}
                  size={24}
                  color={props.color}
                />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}
