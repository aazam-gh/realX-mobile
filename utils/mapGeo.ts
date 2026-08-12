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

export type MapRegionLike = LatLng & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapTileSet = {
  precision: 4 | 5 | 6;
  prefixes: string[];
};

export function mapTileCacheKey(precision: number, prefix: string) {
  return `map_tile_cache_v2:${precision}:${prefix}`;
}

function geohashStepForPrecision(precision: number) {
  if (precision >= 6) return 0.01;
  if (precision >= 5) return 0.035;
  return 0.16;
}

function mapTilePrecisionForRegion(region: MapRegionLike): 4 | 5 | 6 {
  const largestDelta = Math.max(region.latitudeDelta, region.longitudeDelta);
  if (largestDelta <= 0.035) return 6;
  if (largestDelta <= 0.28) return 5;
  return 4;
}

export function mapTileSetForRegion(region: MapRegionLike, maxPrefixes = 28): MapTileSet {
  const precision = mapTilePrecisionForRegion(region);
  const latDelta = Math.max(region.latitudeDelta, 0.01);
  const lngDelta = Math.max(region.longitudeDelta, 0.01);
  const minLat = Math.max(QATAR_BOUNDS.minLatitude, region.latitude - latDelta / 2);
  const maxLat = Math.min(QATAR_BOUNDS.maxLatitude, region.latitude + latDelta / 2);
  const minLng = Math.max(QATAR_BOUNDS.minLongitude, region.longitude - lngDelta / 2);
  const maxLng = Math.min(QATAR_BOUNDS.maxLongitude, region.longitude + lngDelta / 2);
  const step = geohashStepForPrecision(precision);
  const prefixes = new Set<string>();

  for (let lat = minLat; lat <= maxLat + step / 2; lat += step) {
    for (let lng = minLng; lng <= maxLng + step / 2; lng += step) {
      prefixes.add(toGeohash(lat, lng, precision));
    }
  }

  const centerPrefix = toGeohash(region.latitude, region.longitude, precision);
  prefixes.add(centerPrefix);
  prefixes.add(toGeohash(minLat, minLng, precision));
  prefixes.add(toGeohash(minLat, maxLng, precision));
  prefixes.add(toGeohash(maxLat, minLng, precision));
  prefixes.add(toGeohash(maxLat, maxLng, precision));

  const orderedPrefixes = [
    centerPrefix,
    ...Array.from(prefixes).filter((prefix) => prefix !== centerPrefix).sort(),
  ];

  return {
    precision,
    prefixes: orderedPrefixes.slice(0, maxPrefixes).sort(),
  };
}

const TILE_CACHE_INDEX = 'map_tile_cache_v2:index';

export async function rememberMapTileCacheKeys(keys: string[], maxTiles = 80) {
  if (!keys.length) return;

  try {
    const raw = await AsyncStorage.getItem(TILE_CACHE_INDEX);
    const previous = raw ? (JSON.parse(raw) as string[]) : [];
    const uniqueIncoming = Array.from(new Set(keys));
    const next = [
      ...uniqueIncoming,
      ...previous.filter((item) => !uniqueIncoming.includes(item)),
    ];

    const overflow = next.slice(maxTiles);
    if (overflow.length > 0) {
      await AsyncStorage.multiRemove(overflow);
    }

    await AsyncStorage.setItem(TILE_CACHE_INDEX, JSON.stringify(next.slice(0, maxTiles)));
  } catch (error) {
    logger.warn('Unable to persist map tile cache index:', error);
  }
}
