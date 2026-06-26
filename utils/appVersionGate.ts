import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

const MOBILE_VERSION_GATE_PATH = ['appConfig', 'mobileVersionGate'] as const;
const REALX_ANDROID_PACKAGE = 'com.reelx.app';
const REALX_IOS_APP_ID = '6759960382';

export type PlatformUpdateConfig = {
    minimumVersion?: string;
    latestVersion?: string;
    minimumBuild?: number;
    force?: boolean;
    appStoreUrl?: string;
    playStoreUrl?: string;
    fallbackUrl?: string;
};

export type MobileVersionGateConfig = {
    enabled?: boolean;
    ios?: PlatformUpdateConfig;
    android?: PlatformUpdateConfig;
};

export type AppUpdatePromptState = {
    shouldPrompt: boolean;
    force: boolean;
    storeUrl: string | null;
    fallbackUrl: string | null;
    currentVersion: string | null;
    currentBuild: string | null;
};

export const defaultAppUpdatePromptState: AppUpdatePromptState = {
    shouldPrompt: false,
    force: false,
    storeUrl: null,
    fallbackUrl: null,
    currentVersion: null,
    currentBuild: null,
};

function getCurrentVersion() {
    return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? null;
}

function getCurrentBuild() {
    return Application.nativeBuildVersion ?? null;
}

function normalizeVersion(version: string | null | undefined) {
    if (!version) return [];

    return version
        .split('.')
        .map((segment) => {
            const value = Number.parseInt(segment.replace(/[^0-9].*$/, ''), 10);
            return Number.isFinite(value) ? value : 0;
        });
}

export function compareVersions(current: string | null | undefined, target: string | null | undefined) {
    const currentParts = normalizeVersion(current);
    const targetParts = normalizeVersion(target);

    if (currentParts.length === 0 || targetParts.length === 0) {
        return 0;
    }

    const length = Math.max(currentParts.length, targetParts.length);

    for (let index = 0; index < length; index += 1) {
        const currentPart = currentParts[index] ?? 0;
        const targetPart = targetParts[index] ?? 0;

        if (currentPart < targetPart) return -1;
        if (currentPart > targetPart) return 1;
    }

    return 0;
}

function toNumber(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function toString(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizePlatformConfig(value: unknown): PlatformUpdateConfig {
    if (!value || typeof value !== 'object') return {};

    const raw = value as Record<string, unknown>;

    return {
        minimumVersion: toString(raw.minimumVersion),
        latestVersion: toString(raw.latestVersion),
        minimumBuild: toNumber(raw.minimumBuild) ?? undefined,
        force: raw.force === true,
        appStoreUrl: toString(raw.appStoreUrl),
        playStoreUrl: toString(raw.playStoreUrl),
        fallbackUrl: toString(raw.fallbackUrl),
    };
}

function normalizeGateConfig(value: unknown): MobileVersionGateConfig | null {
    if (!value || typeof value !== 'object') return null;

    const raw = value as Record<string, unknown>;

    return {
        enabled: raw.enabled === true,
        ios: normalizePlatformConfig(raw.ios),
        android: normalizePlatformConfig(raw.android),
    };
}

function getPlatformConfig(config: MobileVersionGateConfig) {
    return Platform.OS === 'ios' ? config.ios : config.android;
}

function getStoreUrls(platformConfig: PlatformUpdateConfig) {
    if (Platform.OS === 'ios') {
        return {
            storeUrl: platformConfig.appStoreUrl ?? `https://apps.apple.com/app/id${REALX_IOS_APP_ID}`,
            fallbackUrl: null,
        };
    }

    return {
        storeUrl: platformConfig.playStoreUrl ?? `market://details?id=${REALX_ANDROID_PACKAGE}`,
        fallbackUrl: platformConfig.fallbackUrl ?? `https://play.google.com/store/apps/details?id=${REALX_ANDROID_PACKAGE}`,
    };
}

export async function fetchAppUpdatePromptState(): Promise<AppUpdatePromptState> {
    const firestore = getFirestore();
    const gateRef = doc(firestore, MOBILE_VERSION_GATE_PATH[0], MOBILE_VERSION_GATE_PATH[1]);
    const snapshot = await getDoc(gateRef);

    if (!snapshot.exists()) {
        return defaultAppUpdatePromptState;
    }

    const config = normalizeGateConfig(snapshot.data());
    if (!config?.enabled) {
        return defaultAppUpdatePromptState;
    }

    const platformConfig = getPlatformConfig(config);
    if (!platformConfig) {
        return defaultAppUpdatePromptState;
    }

    const currentVersion = getCurrentVersion();
    const currentBuild = getCurrentBuild();
    const currentBuildNumber = toNumber(currentBuild);

    const isBelowMinimumVersion = Boolean(
        platformConfig.minimumVersion &&
        currentVersion &&
        compareVersions(currentVersion, platformConfig.minimumVersion) < 0,
    );
    const isBelowLatestVersion = Boolean(
        platformConfig.latestVersion &&
        currentVersion &&
        compareVersions(currentVersion, platformConfig.latestVersion) < 0,
    );
    const isBelowMinimumBuild = Boolean(
        platformConfig.minimumBuild &&
        currentBuildNumber !== null &&
        currentBuildNumber < platformConfig.minimumBuild,
    );

    const shouldPrompt = isBelowMinimumVersion || isBelowLatestVersion || isBelowMinimumBuild;
    const { storeUrl, fallbackUrl } = getStoreUrls(platformConfig);

    return {
        shouldPrompt,
        force: platformConfig.force === true || isBelowMinimumVersion || isBelowMinimumBuild,
        storeUrl,
        fallbackUrl,
        currentVersion,
        currentBuild,
    };
}

export async function openAppUpdateStore(promptState: AppUpdatePromptState) {
    if (!promptState.storeUrl) {
        return;
    }

    try {
        await Linking.openURL(promptState.storeUrl);
    } catch (error) {
        if (promptState.fallbackUrl) {
            await Linking.openURL(promptState.fallbackUrl);
            return;
        }

        throw error;
    }
}
