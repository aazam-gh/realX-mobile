import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/AppThemeContext';
import { triggerSubtleHaptic } from '../../utils/haptics';

const AVATAR_SIZE = 60;
const RADAR_SIZE = 84;
const LIGHT_MASCOT = require('../../assets/images/user.png');
const DARK_MASCOT = require('../../assets/images/user-dark.png');

export default function MascotThemeButton() {
  const { isDark, theme, toggleTheme } = useAppTheme();
  const imageMix = useSharedValue(isDark ? 1 : 0);
  const nextPulseRef = useRef(false);
  const pulseA = useSharedValue(1);
  const pulseB = useSharedValue(1);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    imageMix.value = withTiming(isDark ? 1 : 0, {
      duration: 150,
      easing: Easing.out(Easing.cubic),
    });
  }, [imageMix, isDark]);

  const handlePress = useCallback(() => {
    triggerSubtleHaptic();
    void toggleTheme();
    const pulse = nextPulseRef.current ? pulseA : pulseB;

    nextPulseRef.current = !nextPulseRef.current;
    pulse.value = 0;
    pulse.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
    pressScale.value = withSpring(1, { damping: 12, stiffness: 260 });
  }, [pressScale, pulseA, pulseB, toggleTheme]);

  const handlePressIn = useCallback(() => {
    pressScale.value = withTiming(0.94, { duration: 70 });
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 260 });
  }, [pressScale]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const lightImageStyle = useAnimatedStyle(() => ({
    opacity: 1 - imageMix.value,
  }));

  const darkImageStyle = useAnimatedStyle(() => ({
    opacity: imageMix.value,
  }));

  return (
    <Pressable
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
      accessibilityState={{ selected: isDark }}
      hitSlop={8}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.touchTarget}
    >
      <RadarPulse progress={pulseA} />
      <RadarPulse progress={pulseB} />
      <Animated.View style={[styles.avatarFrame, {
        backgroundColor: theme.logoTile,
        borderColor: theme.brand,
      }, pressStyle]}>
        <Animated.Image source={LIGHT_MASCOT} style={[styles.avatarImage, lightImageStyle]} />
        <Animated.Image source={DARK_MASCOT} style={[styles.avatarImage, darkImageStyle]} />
      </Animated.View>
    </Pressable>
  );
}

function RadarPulse({ progress }: { progress: SharedValue<number> }) {
  const glowStyle = useRadarGlow(progress);
  const innerScanStyle = useRadarRing(progress, 0);
  const middleScanStyle = useRadarRing(progress, 0.16);
  const outerScanStyle = useRadarRing(progress, 0.32);

  return (
    <>
      <Animated.View style={[styles.scanGlow, glowStyle]} />
      <Animated.View style={[styles.scanRing, styles.outerScanRing, outerScanStyle]} />
      <Animated.View style={[styles.scanRing, styles.middleScanRing, middleScanStyle]} />
      <Animated.View style={[styles.scanRing, styles.innerScanRing, innerScanStyle]} />
    </>
  );
}

function useRadarGlow(progress: SharedValue<number>) {
  return useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.24, 1], [0.24, 0.18, 0], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.88, 1.28], 'clamp') }],
  }));
}

function useRadarRing(progress: SharedValue<number>, delay: number) {
  return useAnimatedStyle(() => {
    const phase = Math.max(0, Math.min(1, (progress.value - delay) / (1 - delay)));

    return {
      opacity: interpolate(phase, [0, 0.12, 0.72, 1], [0, 0.72, 0.2, 0], 'clamp'),
      transform: [{ scale: interpolate(phase, [0, 1], [0.72, 1.3], 'clamp') }],
    };
  });
}

const styles = StyleSheet.create({
  touchTarget: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanGlow: {
    position: 'absolute',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.brandGreen,
  },
  scanRing: {
    position: 'absolute',
    top: (AVATAR_SIZE - RADAR_SIZE) / 2,
    left: (AVATAR_SIZE - RADAR_SIZE) / 2,
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
  },
  innerScanRing: {
    borderWidth: 2,
    borderColor: 'rgba(36,225,105,0.76)',
    backgroundColor: 'rgba(36,225,105,0.08)',
  },
  middleScanRing: {
    borderWidth: 1,
    borderColor: 'rgba(24,184,82,0.48)',
    backgroundColor: 'rgba(24,184,82,0.06)',
  },
  outerScanRing: {
    borderWidth: 1,
    borderColor: 'rgba(102,255,168,0.3)',
  },
  avatarFrame: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
