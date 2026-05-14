"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { majors } from "@/data/majors";
import { getLatestTournamentForMajor } from "@/data/tournaments";
import styles from "./Nav.module.css";

export default function Nav() {
  const pathname = usePathname() ?? "/";
  const activeSlug = majors.find((m) => pathname === `/${m.slug}` || pathname.startsWith(`/${m.slug}/`))?.slug;
  const isChampions = pathname.startsWith("/champions");

  return (
    <nav className={styles.nav} aria-label="Major championships">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>FMP</span>
          <span className={styles.brandText}>Family Major Pool</span>
        </Link>
        <ul className={styles.tabs}>
          {majors.map((major) => {
            const tournament = getLatestTournamentForMajor(major.slug);
            const isActive = major.slug === activeSlug;
            return (
              <li key={major.slug}>
                <Link
                  href={tournament ? `/${major.slug}` : "#"}
                  aria-current={isActive ? "page" : undefined}
                  aria-disabled={!tournament}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ""} ${
                    !tournament ? styles.tabDisabled : ""
                  }`}
                  style={
                    isActive
                      ? { borderColor: major.accent, color: major.accent }
                      : undefined
                  }
                >
                  <span className={styles.tabShort}>{major.shortName}</span>
                  <span className={styles.tabFull}>{major.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/champions"
          className={`${styles.championsLink} ${isChampions ? styles.championsLinkActive : ""}`}
          aria-current={isChampions ? "page" : undefined}
        >
          Past Champions
        </Link>
      </div>
    </nav>
  );
}
