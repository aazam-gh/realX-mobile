import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInUp,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type MotionViewProps = {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

type GlowMotionProps = MotionViewProps & {
  glowStyle?: StyleProp<ViewStyle>;
};

const reduceMotion = ReduceMotion.System;

export function OnboardingScreenMotion({ children, delay = 0, style }: MotionViewProps) {
  return (
    <Animated.View
      layout={LinearTransition.duration(220).reduceMotion(reduceMotion)}
      style={style}
    >
      <Animated.View entering={FadeIn.duration(220).delay(delay).reduceMotion(reduceMotion)}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

type FlowSectionMotionProps = MotionViewProps & {
  offset?: number;
};

export function OnboardingFlowSectionMotion({
  children,
  delay = 0,
  offset = 10,
  style,
}: FlowSectionMotionProps) {
  return (
    <Animated.View
      entering={FadeInUp
        .duration(260)
        .delay(delay)
        .easing(Easing.out(Easing.cubic))
        .withInitialValues({ opacity: 0, transform: [{ translateY: offset }] })
        .reduceMotion(reduceMotion)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

type DiscoverTransitionMotionProps = MotionViewProps & {
  active: boolean;
  backgroundColor: string;
  onComplete: () => void;
};

export function OnboardingDiscoverTransitionMotion({
  active,
  backgroundColor,
  children,
  onComplete,
  style,
}: DiscoverTransitionMotionProps) {
  const prefersReducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }

    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    progress.value = withTiming(
      1,
      {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        reduceMotion,
      },
      (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      },
    );
  }, [active, onComplete, prefersReducedMotion, progress]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: -18 * progress.value },
      { scale: 1 - (0.015 * progress.value) },
    ],
  }));

  const revealStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, (progress.value - 0.25) / 0.75),
  }));

  return (
    <Animated.View pointerEvents={active ? 'none' : 'auto'} style={style}>
      <Animated.View style={[{ flex: 1 }, contentStyle]}>{children}</Animated.View>
      <Animated.View
        accessible={false}
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor },
          revealStyle,
        ]}
      />
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
      style={style}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
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

export function OnboardingGlowMotion({ children, glowStyle, style }: GlowMotionProps) {
  const prefersReducedMotion = useReducedMotion();
  const glowOpacity = useSharedValue(prefersReducedMotion ? 0.45 : 0.32);

  useEffect(() => {
    if (prefersReducedMotion) {
      glowOpacity.value = 0.45;
      return;
    }

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.82, { duration: 1200, easing: Easing.inOut(Easing.quad), reduceMotion }),
        withTiming(0.32, { duration: 1200, easing: Easing.inOut(Easing.quad), reduceMotion }),
      ),
      -1,
      false,
    );
  }, [glowOpacity, prefersReducedMotion]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Animated.View pointerEvents="none" style={[glowStyle, animatedGlowStyle]} />
      {children}
    </Animated.View>
  );
}

export function OnboardingCardMotion({ children, delay = 60, style }: MotionViewProps) {
  return (
    <Animated.View
      layout={LinearTransition.duration(240).reduceMotion(reduceMotion)}
      style={style}
    >
      <Animated.View
        entering={FadeInUp.duration(280).delay(delay).easing(Easing.out(Easing.cubic)).reduceMotion(reduceMotion)}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

export function OnboardingStaggerItem({ children, delay = 0, style }: MotionViewProps) {
  return (
    <Animated.View
      layout={LinearTransition.duration(220).reduceMotion(reduceMotion)}
      style={style}
    >
      <Animated.View
        entering={FadeInDown.duration(240).delay(delay).easing(Easing.out(Easing.cubic)).reduceMotion(reduceMotion)}
        exiting={FadeOut.duration(140).reduceMotion(reduceMotion)}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

type RoleCardMotionProps = MotionViewProps & {
  selected?: boolean;
  dimmed?: boolean;
};

export function OnboardingRoleCardMotion({
  children,
  delay = 0,
  dimmed = false,
  selected = false,
  style,
}: RoleCardMotionProps) {
  const prefersReducedMotion = useReducedMotion();
  const hasEntered = useRef(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.985);
  const translateY = useSharedValue(14);

  useEffect(() => {
    if (prefersReducedMotion) {
      opacity.value = dimmed ? 0.52 : 1;
      scale.value = 1;
      translateY.value = 0;
      return;
    }

    if (!hasEntered.current) {
      hasEntered.current = true;
      opacity.value = withDelay(delay, withTiming(dimmed ? 0.52 : 1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        reduceMotion,
      }));
      scale.value = withDelay(delay, withTiming(1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        reduceMotion,
      }));
      translateY.value = withDelay(delay, withTiming(0, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        reduceMotion,
      }));
      return;
    }

    opacity.value = withTiming(dimmed ? 0.52 : 1, { duration: 180, reduceMotion });
    scale.value = withTiming(selected || dimmed ? 0.985 : 1, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
      reduceMotion,
    });
  }, [delay, dimmed, opacity, prefersReducedMotion, scale, selected, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[style, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

type OnboardingPressableMotionProps = {
  children: React.ReactNode;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function OnboardingPressableMotion({
  children,
  disabled = false,
  onPress,
  style,
}: OnboardingPressableMotionProps) {
  const prefersReducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!prefersReducedMotion) {
      scale.value = withTiming(0.98, { duration: 100, reduceMotion });
    }
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic), reduceMotion });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      >
        {children}
      </Pressable>
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
    scale.value = withTiming(prefersReducedMotion ? 1 : enabled ? 1 : 0.98, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
      reduceMotion,
    });
  }, [disabledOpacity, enabled, opacity, prefersReducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
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
      layout={LinearTransition.duration(220).reduceMotion(reduceMotion)}
      style={style}
    >
      <Animated.View
        entering={FadeInUp.duration(240).delay(delay).easing(Easing.out(Easing.cubic)).reduceMotion(reduceMotion)}
        exiting={FadeOut.duration(140).reduceMotion(reduceMotion)}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}
