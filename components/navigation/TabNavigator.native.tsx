import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { createBottomTabNavigator } from 'expo-router/js-tabs';
import { withLayoutContext } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
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
      {...(isIos ? { layoutDirection: direction } : {})}
      screenOptions={{
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.iconMuted,
        ...(isIos ? {
          // Let UIKit provide its adaptive material blur rather than placing a
          // React Native overlay above the native tab controls.
          translucent: true,
        } : {
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopColor: 'transparent',
          },
          tabBarBackground: () => (
            <BlurView
              blurMethod="dimezisBlurViewSdk31Plus"
              blurReductionFactor={3}
              intensity={72}
              tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
              style={StyleSheet.absoluteFill}
            />
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
