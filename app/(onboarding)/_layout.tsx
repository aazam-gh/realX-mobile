import { Stack } from "expo-router";

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                animation: 'fade',
                animationDuration: 220,
                contentStyle: { backgroundColor: '#FFFFFF' },
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="email" />
            <Stack.Screen name="login" />
            <Stack.Screen name="verify" />
            <Stack.Screen name="verification-intro" />
            <Stack.Screen name="details" />
            <Stack.Screen name="upload-id" />
            <Stack.Screen name="pending" options={{ gestureEnabled: false }} />
        </Stack>
    );
}
