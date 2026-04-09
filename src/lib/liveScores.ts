import "server-only";

import { poolData } from "@/data/poolData";
import {
  getCachedLiveLeaderboardAgeMs,
  getCachedLiveLeaderboardData,
  setCachedLiveLeaderboardData,
} from "@/lib/liveScoreCache";
import { getScrapeIntervalMs, isTournamentActive } from "@/lib/scrapeSchedule";

const ESPN_MASTERS_LEADERBOARD_URL =
  process.env.ESPN_MASTERS_LEADERBOARD_URL ??
  "https://www.espn.com/golf/leaderboard?season=2025&tournamentId=401811941";

const SCORE_TOKEN_RE = /^(E|[+-]\d+|--)$/;
const POSITION_TOKEN_RE = /^(T?\d+|-)$/;
const THRU_TOKEN_RE = /^(\d+|F|WD|DQ|CUT|MDF|\*)$/;
const TIME_TOKEN_RE = /^\d{1,2}:\d{2}$/;
const TIME_WITH_PERIOD_RE = /^\d{1,2}:\d{2}\s?(AM|PM)$/i;
const COUNTRY_IMAGE_PREFIX_RE = /^Image:\s*[A-Za-z .'-]+/;

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
  source: "espn-scrape";
  tournament: string;
  status: string;
  updatedAt: string;
  isFallback: boolean;
  entries: LivePoolEntry[];
};

type ParsedLeaderboard = {
  tournament: string;
  status: string;
  players: LivePlayerScore[];
};

type EspnCompetitor = {
  name?: string;
  pos?: string;
  status?: string;
  thru?: number | string;
  today?: string;
  toPar?: string;
  tot?: number | string;
  tee?: string;
};

type EspnLeaderboard = {
  name?: string;
  roundStatusDetail?: string;
  competitors?: EspnCompetitor[];
};

type SearchablePoolPlayer = {
  displayName: string;
  normalizedName: string;
  asciiName: string;
};

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanPlayerName(name: string) {
  return normalizeWhitespace(name.replace(/\s*\(a\)$/i, ""));
}

function stripCountryPrefix(token: string) {
  return normalizeWhitespace(token.replace(COUNTRY_IMAGE_PREFIX_RE, ""));
}

function normalizePlayerName(name: string) {
  return cleanPlayerName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toAsciiLower(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
    return "\u2014";
  }

  if (value === 0) {
    return "E";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

function normalizeEspnScore(score: string | undefined) {
  if (!score) {
    return "--";
  }

  if (score === "E") {
    return "E";
  }

  if (/^[+-]\d+$/.test(score) || score === "--") {
    return score;
  }

  if (/^\d+$/.test(score)) {
    return `+${score}`;
  }

  return "--";
}

function formatEspnThru(competitor: EspnCompetitor) {
  if (competitor.status === "scheduled" && competitor.tee) {
    const teeDate = new Date(competitor.tee);
    return teeDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  }

  if (competitor.status === "cut") {
    return "CUT";
  }

  if (competitor.status === "dq") {
    return "DQ";
  }

  if (competitor.status === "wd") {
    return "WD";
  }

  if (competitor.thru === 18) {
    return "F";
  }

  if (competitor.thru === 0 && competitor.status === "in") {
    return "1";
  }

  if (competitor.thru != null && competitor.thru !== "") {
    return `${competitor.thru}`;
  }

  return "--";
}

function mapEspnStatus(competitor: EspnCompetitor): LivePlayerScore["status"] {
  if (competitor.status === "scheduled") {
    return "scheduled";
  }

  if (competitor.status === "in" || competitor.status === "active") {
    return competitor.thru === 18 ? "finished" : "active";
  }

  if (competitor.status === "cut" || competitor.status === "dq" || competitor.status === "wd") {
    return "finished";
  }

  return "unavailable";
}

function readTimeToken(tokens: string[], index: number) {
  const current = tokens[index];
  if (!current) {
    return null;
  }

  if (TIME_WITH_PERIOD_RE.test(current)) {
    return { value: current.toUpperCase(), nextIndex: index + 1 };
  }

  const next = tokens[index + 1];
  if (TIME_TOKEN_RE.test(current) && /^(AM|PM)$/i.test(next ?? "")) {
    return {
      value: `${current} ${next.toUpperCase()}`,
      nextIndex: index + 2,
    };
  }

  return null;
}

function getPlayerStatus(score: string, thru: string): LivePlayerScore["status"] {
  if (score === "--") {
    return "scheduled";
  }

  if (thru === "F") {
    return "finished";
  }

  return "active";
}

function stripHtmlToTokens(html: string) {
  const text = decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "\n")
      .replace(/<style[\s\S]*?<\/style>/gi, "\n")
      .replace(/<!--[\s\S]*?-->/g, "\n")
      .replace(/<[^>]+>/g, "\n"),
  );

  return text
    .split("\n")
    .map(normalizeWhitespace)
    .filter(Boolean);
}

function getUniquePoolPlayers(): SearchablePoolPlayer[] {
  const uniquePlayers = new Map<string, SearchablePoolPlayer>();

  for (const entry of poolData) {
    for (const playerName of entry.players) {
      const normalizedName = normalizePlayerName(playerName);

      if (!uniquePlayers.has(normalizedName)) {
        uniquePlayers.set(normalizedName, {
          displayName: playerName,
          normalizedName,
          asciiName: toAsciiLower(playerName),
        });
      }
    }
  }

  return [...uniquePlayers.values()];
}

function extractEspnLeaderboardData(html: string): EspnLeaderboard | null {
  const match = html.match(/window\['__espnfitt__'\]=(\{.*\});<\/script>/);
  if (!match) {
    return null;
  }

  const data = JSON.parse(match[1]) as {
    page?: {
      content?: {
        leaderboard?: EspnLeaderboard;
      };
    };
  };

  return data.page?.content?.leaderboard ?? null;
}

function parseLeaderboardFromEspnData(leaderboard: EspnLeaderboard): ParsedLeaderboard | null {
  const competitors = leaderboard.competitors ?? [];
  if (competitors.length === 0) {
    return null;
  }

  const players = competitors
    .filter((competitor) => competitor.name)
    .map((competitor) => {
      const name = cleanPlayerName(competitor.name!);
      const score = normalizeEspnScore(competitor.toPar);

      return {
        name,
        normalizedName: normalizePlayerName(name),
        position: competitor.pos && competitor.pos !== "-" ? competitor.pos : "\u2014",
        score,
        scoreValue: toScoreValue(score),
        today: competitor.today ? normalizeEspnScore(competitor.today) : null,
        thru: formatEspnThru(competitor),
        totalStrokes:
          competitor.tot != null && competitor.tot !== "" ? `${competitor.tot}` : null,
        status: mapEspnStatus(competitor),
      } satisfies LivePlayerScore;
    });

  return {
    tournament: leaderboard.name ?? "Masters Tournament",
    status: leaderboard.roundStatusDetail ?? "Live scores unavailable",
    players,
  };
}

function extractTournament(tokens: string[]) {
  const titleIndex = tokens.findIndex((token) => token === "# Masters Tournament");
  if (titleIndex >= 0) {
    return tokens[titleIndex].replace(/^#\s*/, "");
  }

  return "Masters Tournament";
}

function extractStatus(tokens: string[]) {
  const roundLine = tokens.find((token) => /^Round \d+ - /i.test(token));
  if (roundLine) {
    return roundLine;
  }

  if (tokens.includes("Tournament Field")) {
    return "Tournament Field";
  }

  return "Live scoring unavailable";
}

function parsePlayersFromTokens(tokens: string[]) {
  const headerIndex = tokens.findIndex((token) =>
    token.includes("POS PLAYER SCORE TODAY THRU"),
  );

  if (headerIndex < 0) {
    return parseTournamentFieldPlayers(tokens);
  }

  const players: LivePlayerScore[] = [];

  for (let index = headerIndex + 1; index < tokens.length; ) {
    const token = tokens[index];

    if (
      token === "Glossary" ||
      token === "Latest Golf Videos" ||
      token === "Golf News"
    ) {
      break;
    }

    if (!POSITION_TOKEN_RE.test(token)) {
      index += 1;
      continue;
    }

    const position = token;
    const rawName = tokens[index + 1];

    if (!rawName) {
      break;
    }

    let cursor = index + 2;
    const score = SCORE_TOKEN_RE.test(tokens[cursor] ?? "") ? tokens[cursor] : "--";
    if (cursor < tokens.length) {
      cursor += 1;
    }

    let today: string | null = null;
    if (SCORE_TOKEN_RE.test(tokens[cursor] ?? "")) {
      today = tokens[cursor];
      cursor += 1;
    }

    let thru = "--";
    const timeToken = readTimeToken(tokens, cursor);
    if (timeToken) {
      thru = timeToken.value;
      cursor = timeToken.nextIndex;
    } else if (THRU_TOKEN_RE.test(tokens[cursor] ?? "")) {
      thru = tokens[cursor];
      cursor += 1;
    }

    let totalStrokes: string | null = null;
    if (/^\d+$/.test(tokens[cursor] ?? "")) {
      totalStrokes = tokens[cursor];
      cursor += 1;
    }

    const name = cleanPlayerName(rawName);
    players.push({
      name,
      normalizedName: normalizePlayerName(name),
      position,
      score,
      scoreValue: toScoreValue(score),
      today,
      thru,
      totalStrokes,
      status: getPlayerStatus(score, thru),
    });

    index = cursor;
  }

  return players;
}

function parseRowTail(tail: string) {
  const normalizedTail = normalizeWhitespace(tail);
  const scheduledMatch = normalizedTail.match(
    /^(--)\s*(\d{1,2}:\d{2}\s?(?:AM|PM))[-\s]*$/i,
  );

  if (scheduledMatch) {
    return {
      position: "\u2014",
      score: "--",
      today: null,
      thru: scheduledMatch[2].toUpperCase(),
      totalStrokes: null,
      status: "scheduled" as const,
    };
  }

  const liveMatch = normalizedTail.match(
    /^(E|--|[+-]\d+)\s*(E|--|[+-]\d+)\s*(\d{1,2}:\d{2}\s?(?:AM|PM)|F|WD|DQ|CUT|MDF|\*|\d+)\s*-*\s*(\d+)?\s*-*$/,
  );

  if (!liveMatch) {
    return null;
  }

  const [, score, today, thru, totalStrokes] = liveMatch;
  return {
    position: "\u2014",
    score,
    today,
    thru: thru.toUpperCase(),
    totalStrokes: totalStrokes ?? null,
    status: getPlayerStatus(score, thru.toUpperCase()),
  };
}

function parsePoolPlayersFromLines(lines: string[]) {
  const headerIndex = lines.findIndex((line) =>
    line.includes("POS PLAYER SCORE TODAY THRU"),
  );
  const fieldIndex = lines.findIndex((line) => line.includes("PLAYER TEE TIME"));
  const startIndex = headerIndex >= 0 ? headerIndex + 1 : fieldIndex >= 0 ? fieldIndex + 1 : -1;

  if (startIndex < 0) {
    return [];
  }

  const uniquePoolPlayers = getUniquePoolPlayers();
  const parsedPlayers = new Map<string, LivePlayerScore>();

  for (const rawLine of lines.slice(startIndex)) {
    if (
      rawLine === "Glossary" ||
      rawLine === "Latest Golf Videos" ||
      rawLine === "Golf News"
    ) {
      break;
    }

    const line = stripCountryPrefix(rawLine);
    const asciiLine = toAsciiLower(line);

    for (const poolPlayer of uniquePoolPlayers) {
      if (parsedPlayers.has(poolPlayer.normalizedName)) {
        continue;
      }

      const rawNameIndex = line.indexOf(poolPlayer.displayName);
      const asciiNameIndex =
        rawNameIndex >= 0 ? -1 : asciiLine.indexOf(poolPlayer.asciiName);

      if (rawNameIndex < 0 && asciiNameIndex < 0) {
        continue;
      }

      const tail =
        rawNameIndex >= 0
          ? line.slice(rawNameIndex + poolPlayer.displayName.length)
          : line.slice(asciiNameIndex + poolPlayer.asciiName.length);
      const tailData = parseRowTail(tail);

      if (!tailData) {
        continue;
      }

      const positionMatch = line.match(/^(T?\d+|-)/);
      parsedPlayers.set(poolPlayer.normalizedName, {
        name: poolPlayer.displayName,
        normalizedName: poolPlayer.normalizedName,
        position:
          headerIndex >= 0
            ? positionMatch?.[1] && positionMatch[1] !== "-"
              ? positionMatch[1]
              : "\u2014"
            : "\u2014",
        score: tailData.score,
        scoreValue: toScoreValue(tailData.score),
        today: tailData.today,
        thru: tailData.thru,
        totalStrokes: tailData.totalStrokes,
        status: tailData.status,
      });
    }
  }

  return [...parsedPlayers.values()];
}

function parseTournamentFieldPlayers(tokens: string[]) {
  const headerIndex = tokens.findIndex((token) =>
    token.includes("PLAYER TEE TIME"),
  );

  if (headerIndex < 0) {
    throw new Error("Could not find ESPN leaderboard table.");
  }

  const players: LivePlayerScore[] = [];

  for (let index = headerIndex + 1; index < tokens.length; ) {
    const rawPlayerToken = tokens[index];

    if (
      rawPlayerToken === "Glossary" ||
      rawPlayerToken === "Latest Golf Videos" ||
      rawPlayerToken === "Golf News"
    ) {
      break;
    }

    const teeTime = readTimeToken(tokens, index + 1);
    if (!teeTime) {
      index += 1;
      continue;
    }

    const name = cleanPlayerName(stripCountryPrefix(rawPlayerToken));
    if (!name) {
      index = teeTime.nextIndex;
      continue;
    }

    players.push({
      name,
      normalizedName: normalizePlayerName(name),
      position: "\u2014",
      score: "--",
      scoreValue: null,
      today: null,
      thru: teeTime.value,
      totalStrokes: null,
      status: "scheduled",
    });

    index = teeTime.nextIndex;
  }

  return players;
}

function toPlayerLookup(players: LivePlayerScore[]) {
  const playerMap = new Map<string, LivePlayerScore>();

  for (const player of players) {
    playerMap.set(player.normalizedName, player);
  }

  return playerMap;
}

function buildEntries(players: LivePlayerScore[]) {
  const playerLookup = toPlayerLookup(players);

  const entries = poolData.map((entry) => {
    const scoredPlayers = entry.players.map((name) => {
      const player = playerLookup.get(normalizePlayerName(name));

      return {
        name,
        position: player?.position ?? "\u2014",
        score: player?.score ?? "\u2014",
        thru: player?.thru ?? "No data",
        status: player?.status ?? "unavailable",
        _scoreValue: player?.scoreValue ?? 0,
      };
    });

    const sortedForTop4 = [...scoredPlayers].sort((a, b) => a._scoreValue - b._scoreValue);
    const top4CountedNames = new Set(sortedForTop4.slice(0, 4).map((p) => p.name));

    const totalScoreValue = sortedForTop4.slice(0, 4).reduce((sum, p) => sum + p._scoreValue, 0);

    const finalPlayers = scoredPlayers.map(({ _scoreValue, ...rest }) => ({
      ...rest,
      isScoring: top4CountedNames.has(rest.name),
    })) satisfies PoolPlayerScore[];

    return {
      owner: entry.owner,
      players: finalPlayers,
      totalScoreValue,
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
    totalScore: formatScore(entry.totalScoreValue),
    totalScoreValue: entry.totalScoreValue,
  }));
}

function createFallbackLeaderboard() {
  return {
    source: "espn-scrape" as const,
    tournament: "Masters Tournament",
    status: "Live scores unavailable",
    updatedAt: new Date().toISOString(),
    isFallback: true,
    entries: poolData.map((entry) => ({
      rank: entry.rank,
      owner: entry.owner,
      players: entry.players.map((name, index) => ({
        name,
        position: "\u2014",
        score: "\u2014",
        thru: "Waiting for live data",
        status: "unavailable" as const,
        isScoring: index < 4,
      })),
      totalScore: "\u2014",
      totalScoreValue: 0,
    })),
  };
}

async function fetchLeaderboardHtml() {
  const response = await fetch(ESPN_MASTERS_LEADERBOARD_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ESPN request failed with ${response.status}.`);
  }

  return response.text();
}

function parseLeaderboard(html: string): ParsedLeaderboard {
  const espnLeaderboard = extractEspnLeaderboardData(html);
  const parsedFromEspnData = espnLeaderboard
    ? parseLeaderboardFromEspnData(espnLeaderboard)
    : null;

  if (parsedFromEspnData) {
    return parsedFromEspnData;
  }

  const tokens = stripHtmlToTokens(html);
  const playersFromLines = parsePoolPlayersFromLines(tokens);
  const players =
    playersFromLines.length > 0 ? playersFromLines : parsePlayersFromTokens(tokens);

  if (players.length === 0) {
    throw new Error("ESPN leaderboard did not contain any player rows.");
  }

  return {
    tournament: extractTournament(tokens),
    status: extractStatus(tokens),
    players,
  };
}

export async function getLiveLeaderboardData(): Promise<LiveLeaderboardData> {
  const now = new Date();
  const cachedData = getCachedLiveLeaderboardData();
  const scrapeIntervalMs = getScrapeIntervalMs(now);

  if (!isTournamentActive(now)) {
    return cachedData ?? createFallbackLeaderboard();
  }

  if (
    cachedData &&
    scrapeIntervalMs !== null &&
    getCachedLiveLeaderboardAgeMs(now.getTime()) < scrapeIntervalMs
  ) {
    return cachedData;
  }

  if (cachedData && scrapeIntervalMs === null) {
    return cachedData;
  }

  try {
    const html = await fetchLeaderboardHtml();
    const parsed = parseLeaderboard(html);
    const data: LiveLeaderboardData = {
      source: "espn-scrape",
      tournament: parsed.tournament,
      status: parsed.status,
      updatedAt: new Date().toISOString(),
      isFallback: false,
      entries: buildEntries(parsed.players),
    };

    setCachedLiveLeaderboardData(data, now.getTime());
    return data;
  } catch {
    return cachedData ?? createFallbackLeaderboard();
  }
}
