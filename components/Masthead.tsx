import Link from "next/link";

import styles from "./Masthead.module.css";

export function Masthead() {
  return (
    <header className={styles.bar}>
      <a href="#main" className={`${styles.skip} mono`}>
        Skip to content
      </a>
      <div className={`${styles.inner} shell`}>
        <Link href="/" className={styles.title}>
          Creative Web <em>Reference Gallery</em>
        </Link>
        <nav className={`${styles.nav} mono`} aria-label="Sections">
          <Link href="/">Index</Link>
          <Link href="/abilities">Abilities</Link>
          <Link href="/progress">Progress</Link>
        </nav>
      </div>
    </header>
  );
}
