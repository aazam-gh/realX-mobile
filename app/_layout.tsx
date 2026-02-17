import '@react-native-firebase/app';
import { FirebaseAuthTypes, getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'IntegralBold': require('../assets/fonts/integralcf-bold.otf'),
    'MetropolisSemiBold': require('../assets/fonts/metropolis.semi-bold.otf'),
    'MetropolisMedium': require('../assets/fonts/metropolis.medium.otf'),
  });

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Handle user state changes
  function onAuthStateChangedHandler(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), onAuthStateChangedHandler);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (initializing || !loaded) return;

    const inAuthGroup = segments[0] === '(onboarding)';

    if (!user && !inAuthGroup) {
      // Redirect to onboarding if not logged in and not already in onboarding
      router.replace('/(onboarding)');
    } else if (user && inAuthGroup) {
      // Redirect to tabs if logged in and in onboarding
      router.replace('/(tabs)');
    }
  }, [user, initializing, loaded, segments]);

  if (initializing || (!loaded && !error)) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="category" options={{ headerShown: false }} />
      <Stack.Screen name="vendor/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="redeem/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: "Oops! Not Found" }} />
    </Stack>
  );
}

