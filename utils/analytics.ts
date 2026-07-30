import { getAnalytics, logEvent } from '@react-native-firebase/analytics';

import { logger } from './logger';

type AnalyticsParameters = Record<string, string | number | boolean | undefined>;

export async function trackEvent(
  name: string,
  parameters: AnalyticsParameters = {},
) {
  try {
    const normalized = Object.fromEntries(
      Object.entries(parameters).filter(([, value]) => value !== undefined),
    ) as Record<string, string | number | boolean>;
    await logEvent(getAnalytics(), name, normalized);
  } catch (error) {
    logger.warn('Analytics event failed', { name, error });
  }
}
