import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryGrid, GreetingHeader, PromoBanner, SearchBar, TrendingOffers } from '../../components/home';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <GreetingHeader userName="Rayan" />
        <SearchBar placeholder="Search for anything..." />
        <PromoBanner />
        <CategoryGrid />
        <TrendingOffers />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});
