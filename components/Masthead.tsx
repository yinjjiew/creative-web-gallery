import Link from "next/link";

import styles from "./Masthead.module.css";

export function Masthead({
  complete,
  total,
}: {
  complete: number;
  total: number;
}) {
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
          <Link href="/progress" className={styles.live}>
            {complete}/{total} live
          </Link>
        </nav>
      </div>
    </header>
  );
}
