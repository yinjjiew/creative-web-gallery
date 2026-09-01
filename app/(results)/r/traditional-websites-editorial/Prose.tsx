import { HeatFig } from "./figures/HeatFig";
import { GridFig } from "./figures/GridFig";
import { SewerFig } from "./figures/SewerFig";
import { Train } from "./figures/Train";
import type { Block, Note } from "./content/types";
import s from "./works.module.css";

const FIGS = {
  train: Train,
  grid: GridFig,
  heat: HeatFig,
  sewer: SewerFig,
};

export function markNotes(text: string) {
  const parts = text.split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) => {
    const m = part.match(/\{\{(\d+)\}\}/);
    if (!m) return part;
    const n = m[1];
    return (
      <a key={i} className={s.fn} href={`#n-${n}`} id={`ref-${n}`}>
        {n}
      </a>
    );
  });
}

export function Blocks({
  blocks,
  notes,
}: {
  blocks: Block[];
  notes?: Note[];
}) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === "p") {
          const nums = [...b.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) =>
            Number(m[1]),
          );
          return (
            <div key={i} className={s.graf}>
              <p className={b.drop ? s.drop : undefined}>
                {markNotes(b.text)}
              </p>
              {notes &&
                nums.map((n) => {
                  const note = notes.find((x) => x.n === n);
                  if (!note) return null;
                  return (
                    <aside key={n} className={s.sidenote} aria-hidden="true">
                      <b>{n}</b>
                      {note.text}
                    </aside>
                  );
                })}
            </div>
          );
        }
        if (b.t === "h2") {
          return (
            <h2 key={i} id={b.id}>
              {b.text}
            </h2>
          );
        }
        if (b.t === "h3") {
          return <h3 key={i}>{b.text}</h3>;
        }
        if (b.t === "pull") {
          return (
            <blockquote key={i} className={s.pull}>
              {b.text}
            </blockquote>
          );
        }
        if (b.t === "sidebar") {
          return (
            <aside key={i} className={s.sidebar}>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </aside>
          );
        }
        if (b.t === "table") {
          return (
            <div key={i} className={s.tableWrap}>
              <table>
                <caption>{b.caption}</caption>
                <thead>
                  <tr>
                    {b.heads.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        const Fig = FIGS[b.id];
        return (
          <figure key={i} className={s.figure}>
            <Fig />
            <figcaption>
              <b>FIG.</b>
              {b.caption}
            </figcaption>
          </figure>
        );
      })}
    </>
  );
}

export function Notes({ notes }: { notes: Note[] }) {
  if (!notes.length) return null;
  return (
    <section className={s.notes} aria-label="Notes">
      <h2>Notes</h2>
      <ol>
        {notes.map((n) => (
          <li key={n.n} id={`n-${n.n}`}>
            <a className={s.fn} href={`#ref-${n.n}`}>
              {n.n}
            </a>{" "}
            {n.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
