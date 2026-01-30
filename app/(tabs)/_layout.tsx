import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.dark.tint,
                headerTitleStyle: {
                    fontFamily: Typography.metropolis.semiBold,
                },
                tabBarLabelStyle: {
                    fontFamily: Typography.metropolis.medium,
                },
                headerStyle: {
                    backgroundColor: Colors.dark.background,
                },
                headerShadowVisible: false,
                headerTintColor: Colors.dark.text,
                tabBarStyle: {
                    backgroundColor: Colors.dark.background,
                },
                tabBarShowLabel: true,
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
                    ),
                }}
            />
            <Tabs.Screen
                name="about"
                options={{
                    title: 'About',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24} />
                    ),
                }} />
        </Tabs>
    );
}

