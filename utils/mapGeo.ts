import AsyncStorage from '@react-native-async-storage/async-storage';
import { geohashForLocation } from 'geofire-common';
import { logger } from './logger';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export const DOHA_CENTER: LatLng = {
  latitude: 25.2854,
  longitude: 51.531,
};

export const QATAR_BOUNDS = {
  minLatitude: 24.45,
  maxLatitude: 26.25,
  minLongitude: 50.73,
  maxLongitude: 51.68,
};

export function isValidLatLng(lat?: number, lng?: number): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isInQatar(lat: number, lng: number) {
  return (
    lat >= QATAR_BOUNDS.minLatitude &&
    lat <= QATAR_BOUNDS.maxLatitude &&
    lng >= QATAR_BOUNDS.minLongitude &&
    lng <= QATAR_BOUNDS.maxLongitude
  );
}

export function toGeohash(lat: number, lng: number, precision = 5) {
  return geohashForLocation([lat, lng]).slice(0, precision);
}

export function haversineDistanceKm(from: LatLng, to: LatLng) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function radiusMetersForZoom(zoom: number) {
  if (zoom >= 15) return 2000;
  if (zoom >= 13) return 5000;
  if (zoom >= 11) return 10000;
  return 20000;
}

export function regionCacheKey(regionGeohash: string) {
  return `map_region_cache_v1:${regionGeohash}`;
}

const REGION_CACHE_INDEX = 'map_region_cache_v1:index';

export async function rememberRegionCacheKey(regionGeohash: string, maxRegions = 18) {
  try {
    const key = regionCacheKey(regionGeohash);
    const raw = await AsyncStorage.getItem(REGION_CACHE_INDEX);
    const previous = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [key, ...previous.filter((item) => item !== key)];

    const overflow = next.slice(maxRegions);
    if (overflow.length > 0) {
      await AsyncStorage.multiRemove(overflow);
    }

    await AsyncStorage.setItem(REGION_CACHE_INDEX, JSON.stringify(next.slice(0, maxRegions)));
  } catch (error) {
    logger.warn('Unable to persist region cache index:', error);
  }
}

