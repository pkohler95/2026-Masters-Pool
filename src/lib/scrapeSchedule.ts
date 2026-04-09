const MASTERS_TIME_ZONE = "America/Chicago";
const TOURNAMENT_START = "2026-04-09T00:00:00-05:00";
const TOURNAMENT_END = "2026-04-13T00:00:00-05:00";
const MORNING_INTERVAL_MS = 120_000;
const AFTERNOON_INTERVAL_MS = 60_000;
const IDLE_RECHECK_MS = 60_000;

function getTimeParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MASTERS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const valueFor = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: valueFor("year"),
    month: valueFor("month"),
    day: valueFor("day"),
    hour: valueFor("hour"),
    minute: valueFor("minute"),
  };
}

export function isTournamentActive(date = new Date()) {
  const time = date.getTime();
  return (
    time >= new Date(TOURNAMENT_START).getTime() &&
    time < new Date(TOURNAMENT_END).getTime()
  );
}

export function getScrapeIntervalMs(date = new Date()) {
  if (!isTournamentActive(date)) {
    return null;
  }

  const { hour } = getTimeParts(date);

  if (hour >= 8 && hour < 12) {
    return MORNING_INTERVAL_MS;
  }

  if (hour >= 12 && hour < 19) {
    return AFTERNOON_INTERVAL_MS;
  }

  return null;
}

export function getClientRefreshDelayMs(date = new Date()) {
  return getScrapeIntervalMs(date) ?? IDLE_RECHECK_MS;
}
