import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HelpLink,
  HowItWorksDrawer,
  RecentRedemptions,
  SpendButton,
  SpendCardDrawer,
  XCard,
  XCardHeader,
} from '../../components/wallet';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [isHelpDrawerVisible, setIsHelpDrawerVisible] = useState(false);
  const [isSpendDrawerVisible, setIsSpendDrawerVisible] = useState(false);

  // Placeholder balance - replace with actual data
  const balance = 26;
  const currency = 'QAR';

  const handleSpendPress = () => {
    setIsSpendDrawerVisible(true);
  };

  const handleSpendDrawerClose = () => {
    setIsSpendDrawerVisible(false);
  };

  const handleHelpPress = () => {
    setIsHelpDrawerVisible(true);
  };

  const handleHelpDrawerClose = () => {
    setIsHelpDrawerVisible(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <XCardHeader />
        <XCard earnings={balance} currency={currency} />
        <SpendButton onPress={handleSpendPress} />
        <HelpLink onPress={handleHelpPress} />
        <RecentRedemptions />
      </ScrollView>

      <HowItWorksDrawer
        visible={isHelpDrawerVisible}
        onClose={handleHelpDrawerClose}
      />

      <SpendCardDrawer
        visible={isSpendDrawerVisible}
        onClose={handleSpendDrawerClose}
        balance={balance}
        currency={currency}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
