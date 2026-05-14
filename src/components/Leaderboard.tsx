import FamilyRow from "./FamilyRow";
import styles from "./Leaderboard.module.css";
import type { Tournament } from "@/data/types";
import { getLiveLeaderboardData } from "@/lib/liveScores";

interface LeaderboardProps {
  tournament: Tournament;
}

export default async function Leaderboard({ tournament }: LeaderboardProps) {
  const data = await getLiveLeaderboardData(tournament);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Live Standings</h2>
        <div className={styles.controls}>
          <span className={styles.statusBadge}>
            <span
              className={`${styles.statusDot} ${data.isFallback ? styles.offline : styles.live}`}
            ></span>
            {data.status}
          </span>
        </div>
      </div>

      <div className={styles.list}>
        {data.entries.map((entry) => (
          <FamilyRow key={entry.owner} entry={entry} />
        ))}
      </div>
    </div>
  );
}
