import type { MajorSlug, Tournament } from "../types";
import { masters2026 } from "./2026-masters";
import { pgaChampionship2026 } from "./2026-pga-championship";
import { usOpen2026 } from "./2026-us-open";

export const tournaments: Tournament[] = [
  masters2026,
  pgaChampionship2026,
  usOpen2026,
];

export function getTournament(slug: MajorSlug, year: number): Tournament | undefined {
  return tournaments.find((t) => t.slug === slug && t.year === year);
}

export function getLatestTournamentForMajor(slug: MajorSlug): Tournament | undefined {
  return [...tournaments]
    .filter((t) => t.slug === slug)
    .sort((a, b) => b.year - a.year)[0];
}

function startOfDayUtc(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getTime();
}

function endOfPlayUtc(isoDate: string): number {
  return new Date(`${isoDate}T23:59:59Z`).getTime();
}

export function getActiveTournament(now = new Date()): Tournament | undefined {
  const ts = now.getTime();
  return tournaments.find(
    (t) => ts >= startOfDayUtc(t.startDate) && ts <= endOfPlayUtc(t.endDate),
  );
}

export function getUpcomingTournament(now = new Date()): Tournament | undefined {
  const ts = now.getTime();
  return [...tournaments]
    .filter((t) => startOfDayUtc(t.startDate) > ts)
    .sort((a, b) => startOfDayUtc(a.startDate) - startOfDayUtc(b.startDate))[0];
}

export function getMostRecentCompletedTournament(now = new Date()): Tournament | undefined {
  const ts = now.getTime();
  return [...tournaments]
    .filter((t) => endOfPlayUtc(t.endDate) < ts)
    .sort((a, b) => endOfPlayUtc(b.endDate) - endOfPlayUtc(a.endDate))[0];
}

export function getDefaultTournament(now = new Date()): Tournament {
  return (
    getActiveTournament(now) ??
    getUpcomingTournament(now) ??
    getMostRecentCompletedTournament(now) ??
    tournaments[0]
  );
}
