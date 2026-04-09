import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            <span className={styles.year}>2026</span>
            <span className={styles.main}>Masters Pool</span>
          </h1>
          <p className={styles.subtitle}>Family Leaderboard & Player Picks</p>
        </div>
      </div>
    </header>
  );
}
