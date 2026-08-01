import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";

export default function CustomSplash({ onFinish }: { onFinish: () => void }) {
  const { width } = useWindowDimensions();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const imageSize = Math.min(width * 0.9, 420);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    async function start() {
      await SplashScreen.hideAsync();
      if (cancelled) return;

      // Animate in
      const duration = prefersReducedMotion ? 0 : 320;
      opacity.value = withTiming(1, { duration });
      scale.value = withTiming(1, { duration });

      // Wait then finish
      finishTimer = setTimeout(() => {
        onFinish();
      }, prefersReducedMotion ? 120 : 700);
    }

    void start();
    return () => {
      cancelled = true;
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [onFinish, opacity, prefersReducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Image
          source={require("../assets/images/splash.png")}
          style={[styles.image, { width: imageSize, height: imageSize }]}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#18B852",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    maxWidth: "90%",
  },
});
