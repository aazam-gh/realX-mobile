import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  View,
  type RefreshControlProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../context/AppThemeContext';

const loaderSource = require('../assets/images/loaders/realx-transaction-loader.gif');

type UseRealXRefreshOptions = Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> & {
  onRefresh: () => void | Promise<unknown>;
};

export function useRealXRefresh({ onRefresh, ...refreshControlProps }: UseRealXRefreshOptions) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  const refreshControl = (
    <RefreshControl
      {...refreshControlProps}
      refreshing={refreshing}
      onRefresh={() => void handleRefresh()}
      tintColor="transparent"
      colors={["transparent"]}
      progressBackgroundColor="transparent"
    />
  );

  const refreshOverlay = refreshing ? (
    <View
      pointerEvents="none"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('loading')}
      style={[styles.overlay, { backgroundColor: `${theme.background}D9` }]}
    >
      <Image
        source={loaderSource}
        style={styles.loader}
        contentFit="contain"
        autoplay
        cachePolicy="memory-disk"
      />
    </View>
  ) : null;

  return { refreshing, refreshControl, refreshOverlay };
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loader: {
    width: 128,
    height: 128,
  },
});
