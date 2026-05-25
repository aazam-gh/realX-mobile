import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, I18nManager, Platform, StyleSheet, Text, View } from 'react-native';
import { Typography } from '../../constants/Typography';
import PhonkText from '../PhonkText';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_ASPECT_RATIO = 335 / 190;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

type Props = {
  earnings?: number;
  currency?: string;
  creatorCode?: string;
};

export default function AZxXCard({ earnings = 0, currency = 'XP', creatorCode }: Props) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const useNativeGlass = canUseNativeGlass();
  const glossAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glossAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(1700),
        Animated.timing(glossAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [glossAnim]);

  const glossTranslateX = glossAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH * 0.7, CARD_WIDTH * 0.9],
  });

  const glossOpacity = glossAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.55, 0.55, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.cardBorder}>
        <View pointerEvents="none" style={styles.borderGlowTopLeft} />
        <View pointerEvents="none" style={styles.borderGlowBottomRight} />
        <View style={styles.cardShell}>
          <View pointerEvents="none" style={styles.backdrop}>
            <View style={styles.greenBloomLeft} />
            <View style={styles.greenBloomRight} />
            <View style={styles.darkDepth} />
          </View>

          {useNativeGlass ? (
            <GlassView
              style={StyleSheet.absoluteFillObject}
              glassEffectStyle={{
                style: 'regular',
                animate: true,
                animationDuration: 0.35,
              }}
              colorScheme="light"
              tintColor="rgba(8, 56, 44, 0.58)"
              isInteractive
            />
          ) : (
            <View style={styles.fallbackGlass} />
          )}

          <View pointerEvents="none" style={styles.topSheen} />
          <View pointerEvents="none" style={styles.bottomTint} />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.diagonalGloss,
              {
                opacity: glossOpacity,
                transform: [{ translateX: glossTranslateX }, { skewX: '-14deg' }],
              },
            ]}
          />

          <View pointerEvents="none" style={styles.innerStroke} />

          <View style={styles.cardContent}>
            <View style={[styles.topRow, isRTL && styles.topRowRTL]}>
              <View style={styles.earningsSection}>
                <Text style={styles.earningsLabel}>{t('xcard_cashback_label')}</Text>
                <Text style={styles.earningsAmount}>
                  {earnings.toFixed(2)} {currency}
                </Text>
              </View>

            </View>

            <View style={[styles.bottomRow, isRTL && styles.bottomRowRTL]}>
              {creatorCode ? (
                <View style={[styles.creatorCodeContainer, isRTL && styles.creatorCodeContainerRTL]}>
                  <Text style={styles.creatorCodeLabel}>{t('xcard_creator_code_label')}</Text>
                  <PhonkText style={styles.creatorCodeText}>{creatorCode}</PhonkText>
                </View>
              ) : (
                <View style={styles.creatorCodeSpacer} />
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function canUseNativeGlass() {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    return isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cardBorder: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 30,
    padding: 1.4,
    overflow: 'hidden',
    backgroundColor: 'rgba(95, 188, 155, 0.32)',
    shadowColor: '#1A8D6A',
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
  borderGlowTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH * 0.72,
    height: CARD_HEIGHT * 0.58,
    borderTopLeftRadius: 30,
    borderBottomRightRadius: 90,
    backgroundColor: 'rgba(146, 235, 205, 0.14)',
  },
  borderGlowBottomRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: CARD_WIDTH * 0.58,
    height: CARD_HEIGHT * 0.62,
    borderTopLeftRadius: 110,
    borderBottomRightRadius: 30,
    backgroundColor: 'rgba(4, 26, 20, 0.72)',
  },
  cardShell: {
    flex: 1,
    borderRadius: 29,
    overflow: 'hidden',
    backgroundColor: 'rgba(2, 22, 17, 0.9)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  greenBloomLeft: {
    position: 'absolute',
    left: -42,
    top: -28,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(35, 166, 126, 0.26)',
  },
  greenBloomRight: {
    position: 'absolute',
    right: -50,
    bottom: -60,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(24, 126, 95, 0.28)',
  },
  darkDepth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '85%',
    backgroundColor: 'rgba(2, 18, 14, 0.72)',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 22,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  fallbackGlass: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26, 92, 71, 0.26)',
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '44%',
    backgroundColor: 'rgba(210, 255, 240, 0.1)',
  },
  bottomTint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
    backgroundColor: 'rgba(14, 80, 61, 0.28)',
  },
  diagonalGloss: {
    position: 'absolute',
    top: -20,
    left: CARD_WIDTH * 0.15,
    width: CARD_WIDTH * 0.26,
    height: CARD_HEIGHT + 60,
    backgroundColor: 'rgba(166, 236, 214, 0.13)',
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: 'rgba(173, 234, 210, 0.4)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  topRowRTL: {
    flexDirection: 'row-reverse',
  },
  earningsSection: {
    flex: 1,
    minWidth: 0,
  },
  earningsLabel: {
    fontSize: 22,
    fontFamily: Typography.poppins.medium,
    color: 'rgba(236, 248, 243, 0.72)',
    marginBottom: 4,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  earningsAmount: {
    fontSize: 46,
    lineHeight: 52,
    fontFamily: Typography.hanson.bold,
    color: 'rgba(238, 249, 244, 0.88)',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 3 },
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  bottomRowRTL: {
    flexDirection: 'row-reverse',
  },
  creatorCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  creatorCodeContainerRTL: {
    flexDirection: 'row-reverse',
  },
  creatorCodeSpacer: {
    flex: 1,
  },
  creatorCodeLabel: {
    fontSize: 15,
    fontFamily: Typography.poppins.semiBold,
    color: 'rgba(236, 248, 243, 0.72)',
    letterSpacing: 1.2,
    textAlign: 'left',
  },
  creatorCodeText: {
    fontSize: 26,
    lineHeight: 30,
    color: 'rgba(239, 251, 246, 0.9)',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.38)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
});
