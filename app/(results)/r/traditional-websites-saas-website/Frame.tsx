import Link from "next/link";

import { BASE, FIRM, NAV, TASK } from "./data";
import s from "./rota.module.css";

export function Skip() {
  return (
    <a className={s.skip} href="#main">
      Skip to the page
    </a>
  );
}

export function Mast({ current }: { current: string }) {
  return (
    <header className={s.mast}>
      <div className={s.mastRow}>
        <p className={s.wordmark}>
          <Link href={BASE}>{FIRM.name}</Link>
        </p>
        <p className={s.tag}>{FIRM.line}</p>
      </div>
      <nav className={s.nav} aria-label="Rota">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={current === item.id ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Colophon() {
  return (
    <p className={s.colophon}>
      {FIRM.legal} is a modelled company, written for this gallery. {FIRM.place}{" "}
      is a real city; the office, the telephone, the mailbox and every figure
      on these pages are invented. Staves is a modelled restaurant. The week
      ending 24 August is written to be typical of an independent dining room,
      not taken from a client. Rules cited (PAYE, RTI, young workers, the
      Employment (Allocation of Tips) Act 2023) are real UK law described in
      outline — not advice, and not a substitute for your accountant.
    </p>
  );
}

export function End() {
  return (
    <footer className={s.end}>
      <p className={s.endFirm}>
        {FIRM.legal}
        <span aria-hidden="true"> · </span>
        {FIRM.place}
      </p>
      <p className={s.escape}>
        <Link href={TASK}>The brief</Link>
      </p>
    </footer>
  );
}

export function Page({
  current,
  children,
}: {
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className={s.sheet}>
      <Skip />
      <Mast current={current} />
      <main id="main" className={s.main}>
        {children}
      </main>
      <End />
    </div>
  );
}
