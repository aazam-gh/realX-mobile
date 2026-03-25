import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { withLayoutContext } from 'expo-router';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';

const JSTabsNavigator = createBottomTabNavigator().Navigator;
const Tabs = withLayoutContext(JSTabsNavigator);

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          direction: 'ltr',
        },
        sceneStyle: {
          direction: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('wallet'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'card' : 'card-outline'} size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile_full'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
