import type { Tournament } from "@/data/types";

const MORNING_INTERVAL_MS = 120_000;
const AFTERNOON_INTERVAL_MS = 60_000;
const IDLE_RECHECK_MS = 60_000;

function getTournamentWindow(tournament: Tournament) {
  const start = new Date(`${tournament.startDate}T00:00:00Z`).getTime();
  const end = new Date(`${tournament.endDate}T23:59:59Z`).getTime();
  return { start, end };
}

function getHourInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  return Number(parts.find((p) => p.type === "hour")?.value ?? "0");
}

export function isTournamentActive(tournament: Tournament, date = new Date()) {
  const { start, end } = getTournamentWindow(tournament);
  const t = date.getTime();
  return t >= start && t <= end;
}

export function getScrapeIntervalMs(tournament: Tournament, date = new Date()) {
  if (!isTournamentActive(tournament, date)) {
    return null;
  }

  const hour = getHourInTimeZone(date, tournament.timeZone);

  if (hour >= 7 && hour < 12) {
    return MORNING_INTERVAL_MS;
  }

  if (hour >= 12 && hour < 21) {
    return AFTERNOON_INTERVAL_MS;
  }

  return null;
}

export function getClientRefreshDelayMs(tournament: Tournament, date = new Date()) {
  return getScrapeIntervalMs(tournament, date) ?? IDLE_RECHECK_MS;
}
