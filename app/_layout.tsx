import { Lato_300Light, Lato_400Regular, Lato_700Bold, Lato_900Black, useFonts } from '@expo-google-fonts/lato';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
    Lato_300Light,
    Lato_900Black,
    'IntegralBold': require('../assets/fonts/integralcf-bold.otf'),
    'MetropolisSemiBold': require('../assets/fonts/metropolis.semi-bold.otf'),
    'MetropolisMedium': require('../assets/fonts/metropolis.medium.otf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: "Oops! Not Found" }} />
    </Stack>
  );
}

