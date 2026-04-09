import type { PoolPlayerScore } from "@/lib/liveScores";
import styles from "./PlayerCard.module.css";

interface PlayerCardProps {
  player: PoolPlayerScore;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  return (
    <div className={`${styles.card} ${player.isScoring === false ? styles.nonScoring : ""}`}>
      <div className={styles.avatarPlaceholder}>
        {player.name.charAt(0)}
      </div>
      <div className={styles.info}>
        <span className={styles.name}>{player.name}</span>
        <div className={styles.metaRow}>
          <span className={styles.score}>{player.score}</span>
          <span className={styles.separator}>•</span>
          <span className={styles.position}>Pos {player.position}</span>
          <span className={styles.separator}>•</span>
          <span className={styles.thru}>{player.thru}</span>
        </div>
      </div>
    </div>
  );
}
