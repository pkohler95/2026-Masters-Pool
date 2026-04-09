import { getLiveLeaderboardData } from "@/lib/liveScores";

export const runtime = "nodejs";

export async function GET() {
  const data = await getLiveLeaderboardData();
  return Response.json(data);
}
