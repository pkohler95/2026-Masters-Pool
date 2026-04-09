import type { LiveLeaderboardData } from "@/lib/liveScores";

let cachedData: LiveLeaderboardData | null = null;
let cachedAtMs = 0;

export function getCachedLiveLeaderboardData() {
  return cachedData;
}

export function getCachedLiveLeaderboardAgeMs(now = Date.now()) {
  if (!cachedData) {
    return Number.POSITIVE_INFINITY;
  }

  return now - cachedAtMs;
}

export function setCachedLiveLeaderboardData(data: LiveLeaderboardData, now = Date.now()) {
  cachedData = data;
  cachedAtMs = now;
}
