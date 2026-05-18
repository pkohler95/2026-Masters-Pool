import "server-only";

import type { PastChampion, Tournament } from "@/data/types";
import { pastChampions } from "@/data/champions";
import { tournaments } from "@/data/tournaments";
import { getLiveLeaderboardData } from "@/lib/liveScores";

async function derivePastChampionFromTournament(
  tournament: Tournament,
): Promise<PastChampion | null> {
  if (!tournament.results) {
    return null;
  }

  const data = await getLiveLeaderboardData(tournament);
  const winner = data.entries[0];
  if (!winner) {
    return null;
  }

  return {
    major: tournament.slug,
    year: tournament.year,
    poolWinner: winner.owner,
    poolWinnerScore: winner.totalScore,
    tournamentWinner: tournament.results.winner,
    venue: tournament.venue,
    location: tournament.location,
  };
}

function dedupeChampions(list: PastChampion[]): PastChampion[] {
  const seen = new Set<string>();
  const result: PastChampion[] = [];
  for (const c of list) {
    const key = `${c.major}-${c.year}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(c);
  }
  return result;
}

export async function getAllPastChampions(): Promise<PastChampion[]> {
  const derived: PastChampion[] = [];
  for (const tournament of tournaments) {
    const champion = await derivePastChampionFromTournament(tournament);
    if (champion) {
      derived.push(champion);
    }
  }

  // Manual entries take precedence over derived (so corrections win).
  return dedupeChampions([...pastChampions, ...derived]);
}
