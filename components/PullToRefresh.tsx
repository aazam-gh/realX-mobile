import { useCallback, useRef, useState } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

type UseRealXRefreshOptions = Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> & {
  onRefresh: () => void | Promise<unknown>;
};

export function useRealXRefresh({ onRefresh, ...refreshControlProps }: UseRealXRefreshOptions) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [onRefresh]);

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

  return { refreshing, refreshControl, refreshOverlay: null };
}
