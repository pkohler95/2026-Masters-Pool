import "server-only";

import type { FinalPlayerResult, Tournament } from "@/data/types";
import {
  getCachedLiveLeaderboardAgeMs,
  getCachedLiveLeaderboardData,
  setCachedLiveLeaderboardData,
} from "@/lib/liveScoreCache";
import { getScrapeIntervalMs, isTournamentActive } from "@/lib/scrapeSchedule";

export type LivePlayerScore = {
  name: string;
  normalizedName: string;
  position: string;
  score: string;
  scoreValue: number | null;
  today: string | null;
  thru: string;
  totalStrokes: string | null;
  status: "active" | "scheduled" | "finished" | "unavailable";
};

export type PoolPlayerScore = {
  name: string;
  position: string;
  score: string;
  thru: string;
  status: LivePlayerScore["status"];
  isScoring?: boolean;
};

export type LivePoolEntry = {
  rank: number;
  owner: string;
  players: PoolPlayerScore[];
  totalScore: string;
  totalScoreValue: number;
};

export type LiveLeaderboardData = {
  source: "espn-api" | "frozen-results";
  tournament: string;
  tournamentSlug: string;
  tournamentYear: number;
  status: string;
  updatedAt: string;
  isFallback: boolean;
  isFinal: boolean;
  entries: LivePoolEntry[];
};

type EspnApiAthlete = {
  displayName?: string;
  amateur?: boolean;
};

type EspnApiStatusType = {
  state?: "in" | "pre" | "post" | string;
  description?: string;
  shortDetail?: string;
};

type EspnApiStatus = {
  thru?: number;
  displayThru?: string;
  teeTime?: string;
  position?: {
    displayName?: string;
    id?: string;
    isTie?: boolean;
  };
  type?: EspnApiStatusType;
};

type EspnApiStatistic = {
  name?: string;
  value?: number;
  displayValue?: string;
};

type EspnApiCompetitor = {
  id?: string;
  amateur?: boolean;
  status?: EspnApiStatus;
  score?: { value?: number; displayValue?: string };
  statistics?: EspnApiStatistic[];
  athlete?: EspnApiAthlete;
};

type EspnApiCompetition = {
  status?: { type?: { detail?: string; shortDetail?: string } };
  competitors?: EspnApiCompetitor[];
};

type EspnApiEvent = {
  name?: string;
  competitions?: EspnApiCompetition[];
  status?: { type?: { state?: string; description?: string } };
};

type EspnApiResponse = {
  events?: EspnApiEvent[];
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanPlayerName(name: string) {
  return normalizeWhitespace(name.replace(/\s*\(a\)$/i, ""));
}

function normalizePlayerName(name: string) {
  return cleanPlayerName(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toScoreValue(score: string) {
  if (score === "--") {
    return null;
  }

  if (score === "E") {
    return 0;
  }

  const parsed = Number(score);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatScore(value: number | null) {
  if (value === null) {
    return "—";
  }

  if (value === 0) {
    return "E";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

function formatScoreFromValue(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--";
  }
  return formatScore(value);
}

function formatTeeTime(teeTime: string, timeZone: string) {
  return new Date(teeTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}

function pickStatistic(stats: EspnApiStatistic[] | undefined, name: string) {
  return stats?.find((s) => s.name === name);
}

function mapCompetitorToLivePlayer(
  c: EspnApiCompetitor,
  tournament: Tournament,
): LivePlayerScore | null {
  const name = c.athlete?.displayName;
  if (!name) {
    return null;
  }

  const cleanedName = cleanPlayerName(name);
  const state = c.status?.type?.state;
  const desc = (c.status?.type?.description ?? "").toLowerCase();
  const position = c.status?.position?.displayName;
  const displayThru = c.status?.displayThru;
  const thruNumber = c.status?.thru;
  const teeTime = c.status?.teeTime;

  const scoreToParStat = pickStatistic(c.statistics, "scoreToPar");
  let score = scoreToParStat?.displayValue ?? "--";
  let scoreValue: number | null = null;
  if (scoreToParStat?.value !== undefined && scoreToParStat.value !== null) {
    scoreValue = Number(scoreToParStat.value);
  } else if (score !== "--") {
    scoreValue = toScoreValue(score);
  }

  let status: LivePlayerScore["status"];
  let thru: string;

  if (desc.includes("withdrawn") || desc === "wd") {
    status = "finished";
    thru = "WD";
    score = "WD";
    scoreValue = null;
  } else if (desc.includes("disqualified") || desc === "dq") {
    status = "finished";
    thru = "DQ";
    score = "DQ";
    scoreValue = null;
  } else if (desc === "cut") {
    status = "finished";
    thru = "CUT";
    score = "CUT";
    scoreValue = null;
  } else if (state === "pre" || (thruNumber === 0 && state !== "in" && state !== "post")) {
    status = "scheduled";
    thru = teeTime ? formatTeeTime(teeTime, tournament.timeZone) : (displayThru ?? "--");
    score = score === "--" || score === "E" ? "--" : score;
    if (score === "--") {
      scoreValue = null;
    }
  } else if (state === "post" || thruNumber === 18 || displayThru === "F") {
    status = "finished";
    thru = "F";
  } else {
    status = "active";
    thru = displayThru ?? (thruNumber !== undefined ? `${thruNumber}` : "--");
  }

  const normalizedScore =
    scoreValue !== null && scoreValue !== undefined
      ? formatScoreFromValue(scoreValue)
      : score;

  return {
    name: cleanedName,
    normalizedName: normalizePlayerName(cleanedName),
    position: position && position !== "-" ? position : "—",
    score: normalizedScore,
    scoreValue,
    today: null,
    thru,
    totalStrokes:
      c.score?.value !== undefined && c.score.value !== 0
        ? `${c.score.value}`
        : null,
    status,
  };
}

function toPlayerLookup(players: LivePlayerScore[]) {
  const playerMap = new Map<string, LivePlayerScore>();
  for (const player of players) {
    playerMap.set(player.normalizedName, player);
  }
  return playerMap;
}

const MISSED_CUT_RE = /^(CUT|WD|DQ|MDF)$/i;
const MISSED_CUT_SORT_VALUE = 1_000;
const TEAM_CUT_SORT_VALUE = 1_000_000;

function buildEntries(tournament: Tournament, players: LivePlayerScore[]) {
  const playerLookup = toPlayerLookup(players);

  const entries = tournament.teams.map((team) => {
    let missedCutCount = 0;
    const scoredPlayers = team.players.map((name) => {
      const player = playerLookup.get(normalizePlayerName(name));
      const score = player?.score ?? "—";
      const missedCut = MISSED_CUT_RE.test(score);
      if (missedCut) {
        missedCutCount += 1;
      }

      return {
        name,
        position: player?.position ?? "—",
        score,
        thru: player?.thru ?? "No data",
        status: player?.status ?? "unavailable",
        _scoreValue: missedCut
          ? MISSED_CUT_SORT_VALUE
          : (player?.scoreValue ?? 0),
      };
    });

    const teamCut = missedCutCount > team.players.length - 4;
    const sortedForTop4 = [...scoredPlayers].sort((a, b) => a._scoreValue - b._scoreValue);
    const top4CountedNames = new Set(sortedForTop4.slice(0, 4).map((p) => p.name));

    const totalScoreValue = teamCut
      ? TEAM_CUT_SORT_VALUE
      : sortedForTop4.slice(0, 4).reduce((sum, p) => sum + p._scoreValue, 0);

    const finalPlayers = scoredPlayers.map(({ _scoreValue, ...rest }) => ({
      ...rest,
      isScoring: !teamCut && top4CountedNames.has(rest.name),
    })) satisfies PoolPlayerScore[];

    return {
      owner: team.owner,
      players: finalPlayers,
      totalScoreValue,
      teamCut,
    };
  });

  const sortedEntries = [...entries].sort((left, right) => {
    if (left.totalScoreValue !== right.totalScoreValue) {
      return left.totalScoreValue - right.totalScoreValue;
    }

    return left.owner.localeCompare(right.owner);
  });

  return sortedEntries.map((entry, index) => ({
    rank: index + 1,
    owner: entry.owner,
    players: entry.players,
    totalScore: entry.teamCut ? "CUT" : formatScore(entry.totalScoreValue),
    totalScoreValue: entry.totalScoreValue,
  }));
}

function createFallbackLeaderboard(tournament: Tournament): LiveLeaderboardData {
  return {
    source: "espn-api",
    tournament: tournament.name,
    tournamentSlug: tournament.slug,
    tournamentYear: tournament.year,
    status: "Live scores unavailable",
    updatedAt: new Date().toISOString(),
    isFallback: true,
    isFinal: false,
    entries: tournament.teams.map((team, rank) => ({
      rank: rank + 1,
      owner: team.owner,
      players: team.players.map((name, index) => ({
        name,
        position: "—",
        score: "—",
        thru: "Waiting for live data",
        status: "unavailable" as const,
        isScoring: index < 4,
      })),
      totalScore: "—",
      totalScoreValue: 0,
    })),
  };
}

function finalResultToLivePlayerScore(result: FinalPlayerResult): LivePlayerScore {
  const thru =
    result.status === "made-cut"
      ? "F"
      : result.status === "cut"
        ? "CUT"
        : result.status === "wd"
          ? "WD"
          : "DQ";

  return {
    name: result.name,
    normalizedName: normalizePlayerName(result.name),
    position: result.position,
    score: result.score,
    scoreValue: toScoreValue(result.score),
    today: null,
    thru,
    totalStrokes: result.totalStrokes ?? null,
    status: "finished",
  };
}

function buildFrozenLeaderboard(tournament: Tournament): LiveLeaderboardData {
  const results = tournament.results!;
  const livePlayers = results.players.map(finalResultToLivePlayerScore);

  return {
    source: "frozen-results",
    tournament: tournament.name,
    tournamentSlug: tournament.slug,
    tournamentYear: tournament.year,
    status: `${results.status} · ${results.winner} ${results.winnerScore}`,
    updatedAt: results.finalizedAt,
    isFallback: false,
    isFinal: true,
    entries: buildEntries(tournament, livePlayers),
  };
}

function buildEspnApiUrl(tournament: Tournament) {
  const slugEnvKey = tournament.slug.replace(/-/g, "_").toUpperCase();
  const envOverride = process.env[`ESPN_LEADERBOARD_URL_${slugEnvKey}`];
  if (envOverride) {
    return envOverride;
  }
  return `https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?event=${tournament.espn.tournamentId}`;
}

async function fetchEspnLeaderboard(tournament: Tournament): Promise<EspnApiResponse> {
  const response = await fetch(buildEspnApiUrl(tournament), {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ESPN API request failed with ${response.status}.`);
  }

  return (await response.json()) as EspnApiResponse;
}

function parseEspnApi(
  payload: EspnApiResponse,
  tournament: Tournament,
): { status: string; tournament: string; players: LivePlayerScore[] } {
  const event = payload.events?.[0];
  if (!event) {
    throw new Error("ESPN API returned no events.");
  }

  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  if (competitors.length === 0) {
    throw new Error("ESPN API returned no competitors.");
  }

  const players: LivePlayerScore[] = [];
  for (const c of competitors) {
    const mapped = mapCompetitorToLivePlayer(c, tournament);
    if (mapped) {
      players.push(mapped);
    }
  }

  const statusDetail =
    competition?.status?.type?.detail ??
    competition?.status?.type?.shortDetail ??
    event.status?.type?.description ??
    "Live scoring unavailable";

  return {
    status: statusDetail,
    tournament: event.name ?? tournament.name,
    players,
  };
}

function cacheKey(tournament: Tournament) {
  return `${tournament.slug}-${tournament.year}`;
}

export async function getLiveLeaderboardData(
  tournament: Tournament,
): Promise<LiveLeaderboardData> {
  if (tournament.results) {
    return buildFrozenLeaderboard(tournament);
  }

  const now = new Date();
  const key = cacheKey(tournament);
  const cachedData = getCachedLiveLeaderboardData(key);
  const scrapeIntervalMs = getScrapeIntervalMs(tournament, now);

  if (!isTournamentActive(tournament, now)) {
    return cachedData ?? createFallbackLeaderboard(tournament);
  }

  if (
    cachedData &&
    scrapeIntervalMs !== null &&
    getCachedLiveLeaderboardAgeMs(key, now.getTime()) < scrapeIntervalMs
  ) {
    return cachedData;
  }

  if (cachedData && scrapeIntervalMs === null) {
    return cachedData;
  }

  try {
    const payload = await fetchEspnLeaderboard(tournament);
    const parsed = parseEspnApi(payload, tournament);
    const data: LiveLeaderboardData = {
      source: "espn-api",
      tournament: parsed.tournament,
      tournamentSlug: tournament.slug,
      tournamentYear: tournament.year,
      status: parsed.status,
      updatedAt: new Date().toISOString(),
      isFallback: false,
      isFinal: false,
      entries: buildEntries(tournament, parsed.players),
    };

    setCachedLiveLeaderboardData(key, data, now.getTime());
    return data;
  } catch {
    return cachedData ?? createFallbackLeaderboard(tournament);
  }
}
