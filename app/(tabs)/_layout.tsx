import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { withLayoutContext } from 'expo-router';
import { Platform } from 'react-native';

const NativeTabsNavigator = createNativeBottomTabNavigator().Navigator;
const JSTabsNavigator = createBottomTabNavigator().Navigator;

const NativeTabs = withLayoutContext(NativeTabsNavigator);
const JSTabs = withLayoutContext(JSTabsNavigator);

export default function TabLayout() {
    // Select the navigator based on the platform.
    // Native tabs for iOS (supporting SF Symbols), JS-based tabs for Android to avoid crash and support Ionicons.
    const Tabs = Platform.OS === 'ios' ? NativeTabs : JSTabs;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: (props: any) =>
                        Platform.OS === 'ios'
                            ? ({ sfSymbol: 'house' } as any)
                            : <Ionicons name={props.focused ? 'home' : 'home-outline'} size={24} color={props.color} />,
                }}
            />
            <Tabs.Screen
                name="about"
                options={{
                    title: 'About',
                    headerShown: false,
                    tabBarIcon: (props: any) =>
                        Platform.OS === 'ios'
                            ? ({ sfSymbol: 'person' } as any)
                            : <Ionicons name={props.focused ? 'person' : 'person-outline'} size={24} color={props.color} />,
                }}
            />
        </Tabs>
    );
}
