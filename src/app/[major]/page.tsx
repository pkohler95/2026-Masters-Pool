import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import LiveRefresh from "@/components/LiveRefresh";
import { getMajor, isMajorSlug } from "@/data/majors";
import { getLatestTournamentForMajor } from "@/data/tournaments";

type Params = Promise<{ major: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { major } = await params;
  if (!isMajorSlug(major)) {
    return { title: "Family Major Pool" };
  }
  const tournament = getLatestTournamentForMajor(major);
  if (!tournament) {
    return { title: getMajor(major).name };
  }
  return {
    title: `${tournament.year} ${tournament.name} — Family Pool`,
    description: `Live family pool standings for the ${tournament.year} ${tournament.name}.`,
  };
}

export default async function MajorPage({ params }: { params: Params }) {
  await connection();
  const { major } = await params;

  if (!isMajorSlug(major)) {
    notFound();
  }

  const tournament = getLatestTournamentForMajor(major);
  if (!tournament) {
    notFound();
  }

  return (
    <>
      <LiveRefresh
        startDate={tournament.startDate}
        endDate={tournament.endDate}
        timeZone={tournament.timeZone}
      />
      <Header tournament={tournament} />
      <Leaderboard tournament={tournament} />
    </>
  );
}
