import { View, StyleSheet } from "react-native";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

export default function CustomSplash({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    let cancelled = false;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    async function start() {
      await SplashScreen.hideAsync();
      if (cancelled) return;

      finishTimer = setTimeout(() => {
        onFinish();
      }, 200);
    }

    void start();
    return () => {
      cancelled = true;
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#18B852",
    justifyContent: "center",
    alignItems: "center",
  },
});
