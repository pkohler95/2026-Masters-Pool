export type Team = {
  owner: string;
  players: string[];
};

export type EspnTournamentRef = {
  season: number;
  tournamentId: string;
};

export type FinalPlayerResult = {
  name: string;
  position: string;
  score: string;
  status: "made-cut" | "cut" | "wd" | "dq";
  totalStrokes?: string;
};

export type TournamentResults = {
  status: string;
  finalizedAt: string;
  winner: string;
  winnerScore: string;
  players: FinalPlayerResult[];
};

export type Tournament = {
  slug: MajorSlug;
  year: number;
  name: string;
  shortName: string;
  venue: string;
  location: string;
  startDate: string;
  endDate: string;
  timeZone: string;
  espn: EspnTournamentRef;
  teams: Team[];
  results?: TournamentResults;
  // How many of each team's picks count toward its score. Defaults to 4
  // ("top 4 of 6"). The US Open uses 4 picks that all count.
  countedPlayers?: number;
  // Header subtitle suffix describing the scoring format, e.g.
  // "Top 4 of 6 Count" or "4 Players · All Count". Defaults to "Top 4 of 6 Count".
  scoringLabel?: string;
};

export type MajorSlug =
  | "masters"
  | "pga-championship"
  | "us-open"
  | "open-championship";

export type Major = {
  slug: MajorSlug;
  name: string;
  shortName: string;
  accent: string;
  accentDark: string;
  accentText: string;
};

export type PastChampion = {
  major: MajorSlug;
  year: number;
  poolWinner: string;
  poolWinnerScore?: string;
  tournamentWinner?: string;
  venue?: string;
  location?: string;
};
