import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInUp,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type MotionViewProps = {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

const reduceMotion = ReduceMotion.System;

export function OnboardingScreenMotion({ children, delay = 0, style }: MotionViewProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(220).delay(delay).reduceMotion(reduceMotion)}
      layout={LinearTransition.duration(220).reduceMotion(reduceMotion)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function OnboardingIntroLogoMotion({ children, delay = 80, style }: MotionViewProps) {
  return (
    <Animated.View
      entering={FadeInUp.duration(320).delay(delay).springify().damping(16).stiffness(150).reduceMotion(reduceMotion)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function OnboardingIntroHeadlineMotion({ children, delay = 0, style }: MotionViewProps) {
  return (
    <Animated.View
      entering={FadeInLeft.duration(360).delay(delay).springify().damping(18).stiffness(170).reduceMotion(reduceMotion)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function OnboardingIntroMascotMotion({ children, delay = 320, style }: MotionViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const floatY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      floatY.value = 0;
      rotate.value = 0;
      return;
    }

    const entranceTimer = setTimeout(() => {
      floatY.value = withRepeat(
        withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.quad), reduceMotion }),
        -1,
        true,
      );
      rotate.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad), reduceMotion }),
        -1,
        true,
      );
    }, delay + 420);

    return () => {
      clearTimeout(entranceTimer);
    };
  }, [delay, floatY, prefersReducedMotion, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      entering={FadeInLeft.duration(420).delay(delay).easing(Easing.out(Easing.cubic)).reduceMotion(reduceMotion)}
      style={[style, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

export function OnboardingIntroFooterMotion({ children, delay = 520, style }: MotionViewProps) {
  return (
    <Animated.View
      entering={FadeInUp.duration(320).delay(delay).springify().damping(18).stiffness(150).reduceMotion(reduceMotion)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function OnboardingPulseMotion({ children, style }: MotionViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (prefersReducedMotion) {
      scale.value = 1;
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 700, easing: Easing.inOut(Easing.quad), reduceMotion }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad), reduceMotion }),
      ),
      -1,
      false,
    );
  }, [prefersReducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export function OnboardingCardMotion({ children, delay = 60, style }: MotionViewProps) {
  return (
    <Animated.View
      entering={FadeInUp.duration(280).delay(delay).springify().damping(18).stiffness(160).reduceMotion(reduceMotion)}
      layout={LinearTransition.duration(240).reduceMotion(reduceMotion)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function OnboardingStaggerItem({ children, delay = 0, style }: MotionViewProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(240).delay(delay).springify().damping(18).stiffness(180).reduceMotion(reduceMotion)}
      exiting={FadeOut.duration(140).reduceMotion(reduceMotion)}
      layout={LinearTransition.duration(220).reduceMotion(reduceMotion)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

type ButtonMotionProps = MotionViewProps & {
  enabled: boolean;
  disabledOpacity?: number;
};

export function OnboardingButtonMotion({
  children,
  disabledOpacity = 0.5,
  enabled,
  style,
}: ButtonMotionProps) {
  const prefersReducedMotion = useReducedMotion();
  const opacity = useSharedValue(enabled ? 1 : disabledOpacity);
  const scale = useSharedValue(enabled ? 1 : 0.98);

  useEffect(() => {
    opacity.value = withTiming(enabled ? 1 : disabledOpacity, { duration: 180, reduceMotion });
    scale.value = prefersReducedMotion
      ? withTiming(1, { duration: 120, reduceMotion })
      : withSpring(enabled ? 1 : 0.98, { damping: 18, stiffness: 240, mass: 0.7, reduceMotion });
  }, [disabledOpacity, enabled, opacity, prefersReducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View layout={LinearTransition.duration(200).reduceMotion(reduceMotion)} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

type ShakeMotionProps = MotionViewProps & {
  trigger: number;
};

export function OnboardingShakeMotion({ children, style, trigger }: ShakeMotionProps) {
  const prefersReducedMotion = useReducedMotion();
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger <= 0 || prefersReducedMotion) {
      return;
    }

    translateX.value = withSequence(
      withTiming(-8, { duration: 45, reduceMotion }),
      withTiming(8, { duration: 45, reduceMotion }),
      withTiming(-6, { duration: 45, reduceMotion }),
      withTiming(6, { duration: 45, reduceMotion }),
      withTiming(0, { duration: 60, reduceMotion }),
    );
  }, [prefersReducedMotion, translateX, trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export function OnboardingStateMotion({ children, delay = 0, style }: MotionViewProps) {
  return (
    <Animated.View
      entering={FadeInUp.duration(240).delay(delay).springify().damping(18).stiffness(170).reduceMotion(reduceMotion)}
      exiting={FadeOut.duration(140).reduceMotion(reduceMotion)}
      layout={LinearTransition.duration(220).reduceMotion(reduceMotion)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
