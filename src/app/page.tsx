import { redirect } from "next/navigation";
import { getDefaultTournament } from "@/data/tournaments";

export default function Home() {
  const tournament = getDefaultTournament();
  redirect(`/${tournament.slug}`);
}
