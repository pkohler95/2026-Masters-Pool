import type { LiveLeaderboardData } from "@/lib/liveScores";

type CacheEntry = {
  data: LiveLeaderboardData;
  cachedAtMs: number;
};

const cache = new Map<string, CacheEntry>();

export function getCachedLiveLeaderboardData(key: string) {
  return cache.get(key)?.data ?? null;
}

export function getCachedLiveLeaderboardAgeMs(key: string, now = Date.now()) {
  const entry = cache.get(key);
  if (!entry) {
    return Number.POSITIVE_INFINITY;
  }
  return now - entry.cachedAtMs;
}

export function setCachedLiveLeaderboardData(
  key: string,
  data: LiveLeaderboardData,
  now = Date.now(),
) {
  cache.set(key, { data, cachedAtMs: now });
}
