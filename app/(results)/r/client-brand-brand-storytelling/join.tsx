"use client";

/**
 * §6 — the two asks.
 *
 * Primary: become a member. Secondary: grow one variety and save its seed. They
 * are placed in that order but the second is the one the page has been building
 * towards, because it is the one that closes the loop back to the ledger: taking
 * a variety on draws a segment past the present on its line, in the only bright
 * colour on the page.
 *
 * The tiers, prices and figures are the fictional client's and are labelled. The
 * legal reason a collection like this circulates seed to members rather than
 * selling all of it is real and is note 6.
 */

import { ADOPTABLE, byId } from "./data/varieties";
import Portrait from "./portrait";
import s from "./kirkwall.module.css";

const TIERS = [
  {
    name: "Ordinary member",
    price: "£24",
    per: "a year",
    main: true,
    lines: [
      "Six packets from the members’ list each winter, chosen by you",
      "The seed list in November: nine hundred varieties, with what is short",
      "A grow-out to take on if you want one, and the notes for it",
      "About a fifth of what it costs to keep one accession alive for a year",
    ],
    foot: "The tier almost everyone is on.",
  },
  {
    name: "Grower member",
    price: "£24",
    per: "a year, and a bed",
    main: false,
    lines: [
      "Everything above",
      "One named variety assigned to you for the season, with its history",
      "Seed back to the library in autumn; the rest is yours",
      "Two growers per variety, always, so that no variety sits in one garden",
    ],
    foot: "The tier the collection actually runs on.",
  },
  {
    name: "Supporting member",
    price: "£120",
    per: "a year",
    main: false,
    lines: [
      "Everything above",
      "Funds roughly one biennial grow-out done under glass by the library",
      "Named in the annual accounts, which are two pages long",
    ],
    foot: "For people with no ground, which is most people.",
  },
];

export default function Join({
  adopted,
  onAdopt,
}: {
  adopted: Set<string>;
  onAdopt: (id: string) => void;
}) {
  const mine = [...adopted].map((id) => byId(id)).filter((v) => v !== undefined);

  return (
    <>
      <div className={s.joinGrid}>
        {TIERS.map((t) => (
          <div className={`${s.tier} ${t.main ? s.tierMain : ""}`} key={t.name}>
            <p className={s.tierName}>{t.name}</p>
            <p className={s.tierPrice}>
              {t.price} <span className={s.tierPer}>{t.per}</span>
            </p>
            <ul className={s.tierList}>
              {t.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className={`${s.tierFoot} ${s.mark}`}>{t.foot}</p>
          </div>
        ))}
      </div>

      <p className={s.plateCap} style={{ maxWidth: "44rem" }}>
        <span className={s.chip}>illustrative</span> Kirkwall Seed Library is a
        fictional client written for a brief, so these tiers and prices are
        written for it too (note&nbsp;7). Two things in them are not invented.
        Seed of a vegetable variety may generally only be sold in Britain and the
        EU if the variety is on a national list, and listing costs money, which is
        why real collections of unlisted varieties distribute seed to members
        rather than selling it (note&nbsp;6). And a variety held in one garden is
        one accident from gone, which is why the grower tier pairs people up.
      </p>

      <div className={s.adopt}>
        <div className={s.adoptHead}>
          <h3 className={s.adoptTitle}>Grow one, and save its seed</h3>
          <span className={s.mark}>the second ask, and the whole argument</span>
        </div>
        <p style={{ maxWidth: "40rem" }}>
          Pick one. Six of the collection are offered to members this season, and
          the first four want nothing more difficult than being left alone until
          they rattle. Your line is drawn past the present on the ledger above,
          which is the only mark on that chart that was not already there.
        </p>

        <ul className={s.adoptList}>
          {ADOPTABLE.map((v) => {
            const on = adopted.has(v.id);
            return (
              <li key={v.id}>
                <button
                  type="button"
                  className={`${s.adoptBtn} ${on ? s.adoptBtnOn : ""}`}
                  aria-pressed={on}
                  onClick={() => {
                    onAdopt(v.id);
                  }}
                >
                  <Portrait
                    id={`adopt-${v.id}`}
                    form={v.form}
                    shape={v.shape}
                    complete
                    className={s.adoptThumb}
                  />
                  <span className={s.adoptMeta}>
                    <span className={s.adoptName}>{v.name}</span>
                    <span className={s.adoptEase}>
                      {v.crop} &middot; {v.held?.ease}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className={`${s.pledge} ${mine.length ? s.pledgeLive : ""}`}>
          {mine.length === 0 ? (
            <p className={s.dim} style={{ margin: 0 }}>
              Nothing taken on yet. A membership funds the work; this is the part
              nobody can do on the library&rsquo;s behalf.
            </p>
          ) : (
            <>
              <p className={s.pledgeTitle}>
                {mine.length === 1
                  ? "One variety, kept by you"
                  : `${String(mine.length)} varieties, kept by you`}
              </p>
              <p style={{ margin: "0.4rem 0 0" }}>
                {mine.map((v) => v.name).join(", ")} &mdash; and what that means
                between now and next autumn:
              </p>
              <ol className={s.pledgeSteps}>
                {mine.map((v) => (
                  <li key={v.id}>
                    <strong>{v.name}</strong> ({v.crop}) &mdash;{" "}
                    {v.held?.ease === "straightforward"
                      ? "sow in spring, leave the best plants unpicked, let the seed dry on the plant, and send half back in October."
                      : v.held?.ease === "two seasons"
                        ? "sow this spring, lift the best roots in autumn and keep them frost-free, replant them next spring for seed. Two seasons, one variety."
                        : "this one needs twenty plants and half a mile of distance, so the library will pair you with two other growers and split the population between you."}
                  </li>
                ))}
                <li>
                  Write four lines on a card each year: where it came from, when
                  it was sown, when it cropped, what it tasted like, what went
                  wrong. That card is the difference between a variety and a
                  word.
                </li>
                <li>
                  Send some seed to another grower as well as to the library. Two
                  independent hands and one collection is enough to make a variety
                  difficult to lose, and it costs a stamp.
                </li>
              </ol>
            </>
          )}
        </div>
      </div>
    </>
  );
}
