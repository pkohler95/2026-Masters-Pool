"use client";

import { useState } from "react";
import PlayerCard from "./PlayerCard";
import type { LivePoolEntry } from "@/lib/liveScores";
import styles from "./FamilyRow.module.css";

interface FamilyRowProps {
  entry: LivePoolEntry;
  accent: string;
}

export default function FamilyRow({ entry, accent }: FamilyRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCut = entry.totalScore === "CUT";

  return (
    <div
      className={`${styles.rowContainer} ${isExpanded ? styles.expanded : ""} ${isCut ? styles.cut : ""}`}
    >
      <button
        className={styles.rowHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div
          className={styles.rankBadge}
          style={isCut ? undefined : { background: accent }}
        >
          {isCut ? "—" : `${entry.isTie ? "T" : ""}${entry.rank}`}
        </div>
        <div className={styles.ownerInfo}>
          <h2 className={styles.ownerName}>{entry.owner}</h2>
        </div>
        <div className={styles.scoreContainer}>
          <span className={styles.scoreLabel}>Score</span>
          <span className={styles.scoreValue}>{entry.totalScore}</span>
        </div>
        <div className={styles.chevron}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      <div
        className={styles.expandedContent}
        style={{ maxHeight: isExpanded ? "500px" : "0" }}
      >
        <div className={styles.playersGrid}>
          {entry.players.map((player) => (
            <PlayerCard key={player.name} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}
