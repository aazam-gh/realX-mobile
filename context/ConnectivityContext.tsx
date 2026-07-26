import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ConnectivityContextValue = {
  isOnline: boolean;
  isInternetReachable: boolean | null;
};

const ConnectivityContext = createContext<ConnectivityContextValue | undefined>(undefined);

function toOnline(state: NetInfoState) {
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((nextState) => {
      setState(nextState);
      onlineManager.setOnline(toOnline(nextState));
    });

    return unsubscribe;
  }, []);

  const value = useMemo<ConnectivityContextValue>(() => ({
    isOnline: state ? toOnline(state) : true,
    isInternetReachable: state?.isInternetReachable ?? null,
  }), [state]);

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity() {
  const context = useContext(ConnectivityContext);
  if (!context) throw new Error('useConnectivity must be used within ConnectivityProvider');
  return context;
}
