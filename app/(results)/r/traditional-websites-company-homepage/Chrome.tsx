import Link from "next/link";

import { BASE, FIRM, NAV } from "./data";
import s from "./leckie.module.css";

export function Skip() {
  return (
    <a className={s.skip} href="#main">
      Skip to the page
    </a>
  );
}

export function Mast({ current }: { current?: string }) {
  return (
    <header className={s.mast}>
      <div className={s.mastTop}>
        <p className={s.wordmark}>
          <Link href={BASE}>{FIRM.name}</Link>
        </p>
        <p className={s.mastPlace}>
          <span className={s.placeFull}>{FIRM.place}</span>
          <span className={s.placeShort}>Cardington</span>
          <span aria-hidden="true"> · </span>
          {FIRM.founded}
        </p>
      </div>
      <nav className={s.nav} aria-label="The works">
        <Link href={BASE} aria-current={current === "cover" ? "page" : undefined}>
          Cover
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current === item.label.toLowerCase() ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function TitleBlock({
  drawing,
  title,
  rev = "A",
}: {
  drawing: string;
  title: string;
  rev?: string;
}) {
  return (
    <footer className={s.block} aria-label="Sheet">
      <div className={s.blockCell}>
        <span className={s.blockKey}>Firm</span>
        <span className={s.blockVal}>{FIRM.legal}</span>
      </div>
      <div className={s.blockCell}>
        <span className={s.blockKey}>Drawing</span>
        <span className={s.blockVal}>{drawing}</span>
      </div>
      <div className={s.blockCell}>
        <span className={s.blockKey}>Title</span>
        <span className={s.blockVal}>{title}</span>
      </div>
      <div className={s.blockCell}>
        <span className={s.blockKey}>Rev</span>
        <span className={s.blockVal}>{rev}</span>
      </div>
      <div className={s.blockCell}>
        <span className={s.blockKey}>Scale</span>
        <span className={s.blockVal}>NTS</span>
      </div>
      <p className={s.escape}>
        <Link href="/tasks/traditional-websites-company-homepage">Brief</Link>
      </p>
    </footer>
  );
}

export function Colophon() {
  return (
    <p className={s.colophon}>
      {FIRM.name} is a modelled firm, written for this gallery. Cardington is a
      real place; Building 17, the jobs and every figure on these sheets are
      invented. Specifications are typical of the class of tunnel described,
      not measurements. Where a page gives a “measured” number, that number is
      still modelled, and is labelled as such.
    </p>
  );
}

export function Sheet({
  drawing,
  title,
  current,
  children,
}: {
  drawing: string;
  title: string;
  current?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={s.sheet}>
      <Skip />
      <Mast current={current} />
      <main id="main" className={s.main}>
        {children}
      </main>
      <TitleBlock drawing={drawing} title={title} />
    </div>
  );
}
