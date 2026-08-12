import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useAppTheme } from '../../context/AppThemeContext';

type WalletIcon = {
  name: keyof typeof Ionicons.glyphMap;
  top: number;
  left: number;
  size: number;
  rotation: string;
};

// Keep the ornaments in the scroll gutters so they echo the onboarding/Home
// visual language without competing with the XCard or wallet actions.
const walletBackgroundIcons: WalletIcon[] = [
  { name: 'wallet-outline', top: 0.04, left: 0.01, size: 31, rotation: '-12deg' },
  { name: 'sparkles-outline', top: 0.09, left: 0.92, size: 28, rotation: '12deg' },
  { name: 'cash-outline', top: 0.16, left: 0.01, size: 31, rotation: '10deg' },
  { name: 'gift-outline', top: 0.23, left: 0.91, size: 30, rotation: '-10deg' },
  { name: 'card-outline', top: 0.30, left: 0.01, size: 30, rotation: '-8deg' },
  { name: 'star-outline', top: 0.38, left: 0.92, size: 29, rotation: '10deg' },
  { name: 'trophy-outline', top: 0.46, left: 0.01, size: 31, rotation: '-12deg' },
  { name: 'pricetag-outline', top: 0.54, left: 0.91, size: 31, rotation: '12deg' },
  { name: 'rocket-outline', top: 0.62, left: 0.01, size: 30, rotation: '10deg' },
  { name: 'heart-outline', top: 0.70, left: 0.92, size: 29, rotation: '-10deg' },
  { name: 'cart-outline', top: 0.78, left: 0.01, size: 31, rotation: '-8deg' },
  { name: 'checkmark-circle-outline', top: 0.86, left: 0.91, size: 30, rotation: '10deg' },
  { name: 'infinite-outline', top: 0.94, left: 0.01, size: 31, rotation: '-8deg' },
];

export default function WalletBackgroundIcons() {
  const { height, width } = useWindowDimensions();
  const { isDark, theme } = useAppTheme();
  const canvasHeight = Math.max(height, 1800);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.container, { height: canvasHeight, width }]}
    >
      {walletBackgroundIcons.map((icon, index) => (
        <View
          key={`${icon.name}-${index}`}
          style={[
            styles.icon,
            {
              top: canvasHeight * icon.top,
              left: width * icon.left,
              opacity: isDark ? 0.34 : 0.30,
              transform: [{ rotate: icon.rotation }],
            },
          ]}
        >
          <Ionicons color={theme.brand} name={icon.name} size={icon.size} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  icon: {
    position: 'absolute',
  },
});
