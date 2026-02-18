import '@react-native-firebase/app';
import { FirebaseAuthTypes, getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { clearAuthEmail, getAuthEmail } from './utils/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'IntegralBold': require('../assets/fonts/integralcf-bold.otf'),
    'MetropolisSemiBold': require('../assets/fonts/metropolis.semi-bold.otf'),
    'MetropolisMedium': require('../assets/fonts/metropolis.medium.otf'),
  });

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Handle Firebase Email Link Authentication
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      const authInstance = getAuth();
      if (await authInstance.isSignInWithEmailLink(url)) {
        try {
          const email = await getAuthEmail();
          if (email) {
            await authInstance.signInWithEmailLink(email, url);
            await clearAuthEmail();
            console.log('Successfully signed in with email link!');
          } else {
            // If email is missing, we might need to prompt the user for it
            // but for now we log it.
            console.warn('Email link detected but no email found in storage.');
          }
        } catch (err) {
          console.error('Error signing in with email link:', err);
        }
      }
    };

    // Check if the app was opened via a link
    Linking.getInitialURL().then(handleDeepLink);

    // Subscribe to incoming links while the app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

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
    if (user) {
      const unsubscribe = firestore()
        .collection('students')
        .doc(user.uid)
        .onSnapshot(doc => {
          setHasProfile(doc.exists);
        }, error => {
          console.error('Error fetching student profile:', error);
          setHasProfile(false);
        });
      return () => unsubscribe();
    } else {
      setHasProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (initializing || !loaded) return;

    // Wait for profile check if user is logged in
    if (user && hasProfile === null) return;

    const inAuthGroup = segments[0] === '(onboarding)';

    if (!user && !inAuthGroup) {
      // Redirect to onboarding if not logged in and not already in onboarding
      router.replace('/(onboarding)');
    } else if (user && hasProfile && inAuthGroup) {
      // Redirect to tabs if logged in and HAS a profile but still in onboarding
      router.replace('/(tabs)');
    } else if (user && !hasProfile && !inAuthGroup) {
      // Redirect back to onboarding details if logged in but NO profile and not in onboarding
      router.replace('/(onboarding)/details');
    }
  }, [user, initializing, loaded, segments, hasProfile]);

  if (initializing || (!loaded && !error)) {
    return null;
  }

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}

