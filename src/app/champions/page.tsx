import type { Metadata } from "next";
import { majors } from "@/data/majors";
import { getAllPastChampions } from "@/lib/champions";
import styles from "./champions.module.css";

export const metadata: Metadata = {
  title: "Past Pool Champions — Family Major Pool",
  description: "Family pool winners from past major championships.",
};

export default async function ChampionsPage() {
  const champions = await getAllPastChampions();
  const grouped = majors.map((major) => ({
    major,
    rows: champions
      .filter((c) => c.major === major.slug)
      .sort((a, b) => b.year - a.year),
  }));

  const isEmpty = champions.length === 0;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Family Major Pool</p>
        <h1 className={styles.title}>Past Pool Champions</h1>
        <p className={styles.subtitle}>
          Family pool winners from every major we&apos;ve tracked.
        </p>
      </header>

      {isEmpty ? (
        <div className={styles.emptyState}>
          <p>
            No past results recorded yet. Finalize a tournament by adding a
            <code className={styles.code}>results</code>
            block to its file, or add a manual entry to
            <code className={styles.code}>src/data/champions.ts</code>.
          </p>
        </div>
      ) : (
        <div className={styles.sections}>
          {grouped.map(({ major, rows }) => (
            <section key={major.slug} className={styles.section}>
              <h2 className={styles.sectionTitle} style={{ borderColor: major.accent }}>
                {major.name}
              </h2>
              {rows.length === 0 ? (
                <p className={styles.emptyRow}>No winners recorded yet.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Pool Champion</th>
                      <th>Score</th>
                      <th>Tournament Winner</th>
                      <th>Venue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${row.major}-${row.year}`}>
                        <td>{row.year}</td>
                        <td>{row.poolWinner}</td>
                        <td>{row.poolWinnerScore ?? "—"}</td>
                        <td>{row.tournamentWinner ?? "—"}</td>
                        <td className={styles.venueCell}>
                          {row.venue ? (
                            <>
                              <span>{row.venue}</span>
                              {row.location ? (
                                <span className={styles.venueLocation}>{row.location}</span>
                              ) : null}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
