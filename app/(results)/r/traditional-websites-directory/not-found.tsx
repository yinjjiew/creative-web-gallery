import Link from "next/link";

import { Colophon, Honesty, Masthead, Skip } from "./Chrome";
import { BASE } from "./types";
import s from "./reaches.module.css";

export default function NotFound() {
  return (
    <div className={s.page}>
      <Skip />
      <Masthead sheet="—" />
      <Honesty />
      <main id="main" className={s.missingPage}>
        <h1>No such reach</h1>
        <p>
          That name is not in this edition. A missing page is not a missing
          hazard in the world — only in the catalogue.
        </p>
        <p className={s.back}>
          <Link href={BASE}>Home</Link>
          <span aria-hidden="true"> · </span>
          <Link href={`${BASE}/register`}>The register</Link>
        </p>
      </main>
      <Colophon />
    </div>
  );
}
