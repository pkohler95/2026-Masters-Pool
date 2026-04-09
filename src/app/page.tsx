import { connection } from "next/server";
import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import LiveRefresh from "@/components/LiveRefresh";

export default async function Home() {
  await connection();

  return (
    <main>
      <LiveRefresh />
      <Header />
      <Leaderboard />
    </main>
  );
}
