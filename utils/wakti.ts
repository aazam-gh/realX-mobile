import { Linking, Platform } from 'react-native';

import { triggerSubtleHaptic } from './haptics';
import { logger } from './logger';

const WAKTI_IOS_APP_URL = 'itms-apps://itunes.apple.com/app/id6755150700';
const WAKTI_IOS_WEB_URL = 'https://apps.apple.com/app/id6755150700';
const WAKTI_ANDROID_MARKET_URL = 'market://details?id=ai.wakti.app';
const WAKTI_ANDROID_WEB_URL = 'https://play.google.com/store/apps/details?id=ai.wakti.app';

export async function openWaktiStore(): Promise<boolean> {
    const storeUrls = Platform.OS === 'android'
        ? [WAKTI_ANDROID_MARKET_URL, WAKTI_ANDROID_WEB_URL]
        : [WAKTI_IOS_APP_URL, WAKTI_IOS_WEB_URL];

    triggerSubtleHaptic();

    let lastError: unknown;
    for (const url of storeUrls) {
        try {
            await Linking.openURL(url);
            return true;
        } catch (error) {
            lastError = error;
        }
    }

    logger.error('Error opening Wakti store URL:', lastError);
    return false;
}
