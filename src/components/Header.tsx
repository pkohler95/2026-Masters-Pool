import type { Tournament } from "@/data/types";
import { getMajor } from "@/data/majors";
import styles from "./Header.module.css";

interface HeaderProps {
  tournament: Tournament;
}

function formatDateRange(startDate: string, endDate: string, timeZone: string) {
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);

  const sameMonth =
    start.toLocaleDateString("en-US", { month: "long", timeZone }) ===
    end.toLocaleDateString("en-US", { month: "long", timeZone });

  if (sameMonth) {
    const month = start.toLocaleDateString("en-US", { month: "long", timeZone });
    const startDay = start.toLocaleDateString("en-US", { day: "numeric", timeZone });
    const endDay = end.toLocaleDateString("en-US", { day: "numeric", timeZone });
    const year = end.toLocaleDateString("en-US", { year: "numeric", timeZone });
    return `${month} ${startDay}–${endDay}, ${year}`;
  }

  const startStr = start.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone,
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
  return `${startStr} – ${endStr}`;
}

export default function Header({ tournament }: HeaderProps) {
  const major = getMajor(tournament.slug);
  const headerStyle = {
    background: `linear-gradient(180deg, ${major.accent} 0%, ${major.accentDark} 100%)`,
    borderBottomColor: major.accentText,
  };

  return (
    <header className={styles.header} style={headerStyle}>
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.year} style={{ color: major.accentText }}>
            {tournament.year}
          </p>
          <h1 className={styles.title}>{tournament.name}</h1>
          <p className={styles.subtitle}>
            Family Pool · {tournament.scoringLabel ?? "Top 4 of 6 Count"}
          </p>
          <p className={styles.meta}>
            <span>{tournament.venue}</span>
            <span aria-hidden="true" className={styles.dot}>·</span>
            <span>{tournament.location}</span>
            <span aria-hidden="true" className={styles.dot}>·</span>
            <span>
              {formatDateRange(tournament.startDate, tournament.endDate, tournament.timeZone)}
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
