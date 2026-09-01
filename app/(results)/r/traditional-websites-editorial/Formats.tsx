import { Blocks, Notes } from "./Prose";
import { FORMAT_LABEL, type Article } from "./catalog";
import { afterStorm, heat, nightDesk, sewer, substation } from "./content/archive";
import { stillLive } from "./content/essay";
import { sixty } from "./content/grid";
import { harbour } from "./content/harbour";
import { outfall } from "./content/outfall";
import { river } from "./content/river";
import type {
  DiagramDoc,
  DispatchDoc,
  FeatureDoc,
  InterviewDoc,
} from "./content/types";
import { GridFig } from "./figures/GridFig";
import { HeatFig } from "./figures/HeatFig";
import { PlateFigure } from "./figures/Plates";
import s from "./works.module.css";

const FEATURES: Record<string, FeatureDoc> = {
  "what-the-river-becomes": river,
  "who-owns-a-sewer": sewer,
};

const DISPATCHES: Record<string, DispatchDoc> = {
  "the-outfall": outfall,
  "after-the-storm": afterStorm,
  "a-substation-in-the-dark": substation,
};

const DIAGRAMS: Record<string, DiagramDoc> = {
  "sixty-seconds": sixty,
  "the-last-mile-of-heat": heat,
};

const INTERVIEWS: Record<string, InterviewDoc> = {
  "the-box-is-the-job": harbour,
  "the-night-desk": nightDesk,
};

function Head({ article }: { article: Article }) {
  return (
    <header className={s.articleHead}>
      <p className={s.fmt}>
        {FORMAT_LABEL[article.format]} · {article.section} · issue {article.issue}
      </p>
      <h1>{article.title}</h1>
      <p className={s.dek}>{article.dek}</p>
      <p className={s.by}>
        {article.byline} · {article.date} · {article.words.toLocaleString("en-GB")}{" "}
        words
      </p>
    </header>
  );
}

export function Feature({ article }: { article: Article }) {
  const doc = FEATURES[article.slug];
  return (
    <>
      <Head article={article} />
      <nav className={s.toc} aria-label="Contents">
        <ol>
          {doc.toc.map((t) => (
            <li key={t.id}>
              <a href={`#${t.id}`}>{t.label}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className={`${s.prose} ${s.indent} ${s.withNotes}`}>
        <Blocks blocks={doc.blocks} notes={doc.notes} />
      </div>
      <Notes notes={doc.notes} />
    </>
  );
}

export function Dispatch({ article }: { article: Article }) {
  const doc = DISPATCHES[article.slug];
  return (
    <div className={s.dispatch}>
      <header className={s.dispatchHead}>
        <p className={s.fmt}>
          {FORMAT_LABEL[article.format]} · {article.section} · issue {article.issue}
        </p>
        <h1>{article.title}</h1>
        <p className={s.dateline}>{doc.dateline}</p>
      </header>
      <div className={s.prose} style={{ paddingLeft: 0, paddingRight: 0 }}>
        <Blocks blocks={doc.blocks} />
      </div>
    </div>
  );
}

export function Essay({ article }: { article: Article }) {
  return (
    <div className={s.essay}>
      <header className={s.essayHead}>
        <p className={s.fmt}>
          {FORMAT_LABEL[article.format]} · {article.section} · issue {article.issue}
        </p>
        <h1>{article.title}</h1>
        <p className={s.dek}>{stillLive.stand}</p>
        <p className={s.by}>
          {article.byline} · {article.date} · drawn on site
        </p>
      </header>
      {stillLive.plates.map((p) => (
        <figure key={p.n} className={s.plate}>
          <div className={s.plateFigure}>
            <PlateFigure id={p.figure} />
          </div>
          <div className={s.plateBody}>
            <span className={s.plateNo}>Plate {p.n}</span>
            <p>{p.caption}</p>
          </div>
        </figure>
      ))}
    </div>
  );
}

export function Diagram({ article }: { article: Article }) {
  const doc = DIAGRAMS[article.slug];
  const Fig = doc.figure === "heat" ? HeatFig : GridFig;
  return (
    <>
      <Head article={article} />
      <div className={s.diagramWrap}>
        <div className={s.diagramSticky}>
          <Fig />
        </div>
        <div className={s.diagramCopy}>
          <p>{doc.lede}</p>
          <Blocks blocks={doc.blocks} notes={doc.notes} />
        </div>
      </div>
      {doc.notes ? <Notes notes={doc.notes} /> : null}
    </>
  );
}

export function Interview({ article }: { article: Article }) {
  const doc = INTERVIEWS[article.slug];
  return (
    <div className={s.interview}>
      <header className={s.articleHead} style={{ paddingLeft: 0, paddingRight: 0 }}>
        <p className={s.fmt}>
          {FORMAT_LABEL[article.format]} · {article.section} · issue {article.issue}
        </p>
        <h1>{article.title}</h1>
        <p className={s.dek}>{article.dek}</p>
        <p className={s.by}>
          {doc.subject} · {article.date}
        </p>
        <p className={s.dek} style={{ marginTop: "0.85rem" }}>
          {doc.setting}
        </p>
      </header>
      {doc.turns.map((t) => (
        <div key={t.q}>
          <p className={s.speaker}>Works</p>
          <p className={s.q}>{t.q}</p>
          <div className={s.a}>
            <p className={s.speaker}>
              {article.slug === "the-night-desk" ? "Engineer" : "Harbourmaster"}
            </p>
            {t.a.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
