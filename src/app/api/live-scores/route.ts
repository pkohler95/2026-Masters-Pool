import { getLiveLeaderboardData } from "@/lib/liveScores";
import { getDefaultTournament, getTournament, tournaments } from "@/data/tournaments";
import { isMajorSlug } from "@/data/majors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("major");
  const yearParam = url.searchParams.get("year");

  let tournament = getDefaultTournament();

  if (slug && isMajorSlug(slug)) {
    if (yearParam) {
      const year = Number(yearParam);
      const found = getTournament(slug, year);
      if (found) {
        tournament = found;
      }
    } else {
      const found = tournaments
        .filter((t) => t.slug === slug)
        .sort((a, b) => b.year - a.year)[0];
      if (found) {
        tournament = found;
      }
    }
  }

  const data = await getLiveLeaderboardData(tournament);
  return Response.json(data);
}
