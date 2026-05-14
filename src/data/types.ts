export type Team = {
  owner: string;
  players: string[];
};

export type EspnTournamentRef = {
  season: number;
  tournamentId: string;
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
};
