import { ArchiveView } from "../ArchiveView";
import { Colophon, Masthead, Skip } from "../Chrome";
import s from "../works.module.css";

export const metadata = {
  title: "Archive — Works",
  description: "Every piece, by issue, section and format.",
};

export default function ArchivePage() {
  return (
    <>
      <Skip />
      <Masthead compact />
      <main id="main" className={s.page}>
        <header className={s.pageHead}>
          <p className={s.fmt}>The record</p>
          <h1>Archive</h1>
          <p>
            Four issues so far. The filters are how the archive stays navigable
            as it grows — by the issue as published, by the section we keep, and
            by the form the piece took.
          </p>
        </header>
        <ArchiveView />
      </main>
      <Colophon />
    </>
  );
}
