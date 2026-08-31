"use client";

/**
 * Three causal stories over one unchanging table.
 *
 * The point of the section is that the arithmetic is silent about which number
 * to act on. The counts here are the published kidney-stone figures in all three
 * tabs; only the meaning of the splitting variable changes, and with it the
 * answer. Two of the three stories are invented, and say so.
 */

import { useRef, useState } from "react";

import styles from "./reversal.module.css";
import { ARM_A, ARM_B, KIDNEY_STONES } from "./data";
import { frac, overall, pct, rate } from "./model";

type Shape = "confounder" | "mediator" | "collider";

type Story = {
  id: Shape;
  tab: string;
  real: boolean;
  zName: string;
  strata: [string, string];
  arrows: string;
  /** Which numbers the story licenses you to act on. */
  act: "strata" | "pooled";
  verdict: string;
  body: string[];
};

const STORIES: Story[] = [
  {
    id: "confounder",
    tab: "1 · Common cause",
    real: true,
    zName: "Stone size",
    strata: ["small stones", "large stones"],
    arrows: "Z → T,  Z → Y,  T → Y",
    act: "strata",
    verdict: "Compare within stone size. Open surgery is the better treatment.",
    body: [
      "This is what actually happened. Surgeons sent the large stones to open surgery and the small ones to the newer percutaneous technique, and stone size independently affects whether any treatment works. Stone size therefore sits behind both the treatment a patient received and the result they got, and it was fixed before either.",
      "That makes part of the gap between the two pooled columns a difference between patients rather than between treatments. Holding stone size still removes exactly that part. The disaggregated comparison is the one that answers “which treatment should this stone have”, and open surgery wins it twice.",
    ],
  },
  {
    id: "mediator",
    tab: "2 · Consequence of treatment",
    real: false,
    zName: "Fever in the first day",
    strata: ["no fever", "fever"],
    arrows: "T → Z,  Z → Y,  T → Y",
    act: "pooled",
    verdict:
      "Use the pooled number. On these figures the percutaneous technique is the better treatment.",
    body: [
      "Now suppose — this story is invented, to make a point — that the treatments had been assigned at random, and that the splitting variable is not a property of the stone but something the treatment produces: whether the patient runs a fever in the first twenty-four hours. Suppose fever makes a good outcome less likely.",
      "The counts say that open surgery left 263 of its 350 patients with a fever and the percutaneous technique only 80 of its 350. Within each fever group open surgery still comes out slightly ahead — but causing fever is part of what open surgery does, and the harm that flows through fever is part of its effect.",
      "Splitting by fever holds fixed a consequence of the treatment, and so subtracts some of the treatment's own effect from the comparison. What a patient needs to know is the total effect, and with random assignment the total effect is the pooled number. Conditioning on something measured after treatment can also open collider paths of its own, which is a second reason not to.",
    ],
  },
  {
    id: "collider",
    tab: "3 · Common effect",
    real: false,
    zName: "Written up as a case report",
    strata: ["written up", "not written up"],
    arrows: "T → Z,  Y → Z,  T → Y",
    act: "pooled",
    verdict:
      "Use the pooled number. The split is manufacturing a difference that is not there.",
    body: [
      "A third invented story, with the same counts again. Treatment is assigned at random, every patient is in the table, and the splitting variable is whether the case was written up: the new technique was interesting, so its cases were more likely to be published, and successes were more likely to be published than failures.",
      "Then the splitting variable is a common effect of the treatment and the outcome — a collider. Learning it induces a relationship between the two that does not exist in the patients: inside the written-up group, knowing a case used the less publishable treatment makes it more likely that the outcome was good, since something had to earn the write-up.",
      "So here the disaggregated numbers are the corrupted ones and the pooled comparison is clean. This is the same mechanism as selection bias, with one difference: nobody has been dropped, and the damage is done only if you choose to condition.",
    ],
  },
];

const NODES: Record<
  Shape,
  { from: "T" | "Y" | "Z"; to: "T" | "Y" | "Z" }[]
> = {
  confounder: [
    { from: "Z", to: "T" },
    { from: "Z", to: "Y" },
    { from: "T", to: "Y" },
  ],
  mediator: [
    { from: "T", to: "Z" },
    { from: "Z", to: "Y" },
    { from: "T", to: "Y" },
  ],
  collider: [
    { from: "T", to: "Z" },
    { from: "Y", to: "Z" },
    { from: "T", to: "Y" },
  ],
};

const POS: Record<"T" | "Y" | "Z", { x: number; y: number }> = {
  T: { x: 34, y: 108 },
  Y: { x: 206, y: 108 },
  Z: { x: 120, y: 30 },
};

function Dag({ shape, zName }: { shape: Shape; zName: string }) {
  const id = `arrow-${shape}`;
  const edges = NODES[shape];
  const r = 15;

  return (
    <svg
      className={styles.dag}
      viewBox="0 0 240 152"
      role="img"
      aria-label={`Diagram: ${edges.map((e) => `${e.from} causes ${e.to}`).join(", ")}`}
    >
      <defs>
        <marker
          id={id}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0.6 L7.4 4 L0 7.4 z" fill="var(--ink)" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const a = POS[edge.from];
        const b = POS[edge.to];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        return (
          <line
            key={`${edge.from}${edge.to}`}
            x1={a.x + ux * (r + 3)}
            y1={a.y + uy * (r + 3)}
            x2={b.x - ux * (r + 6)}
            y2={b.y - uy * (r + 6)}
            stroke="var(--ink)"
            strokeWidth={1}
            markerEnd={`url(#${id})`}
          />
        );
      })}

      {(["T", "Y", "Z"] as const).map((key) => (
        <g key={key}>
          <circle
            cx={POS[key].x}
            cy={POS[key].y}
            r={r}
            fill="var(--paper)"
            stroke="var(--rule)"
            strokeWidth={1}
          />
          <text
            className={styles.dagNode}
            x={POS[key].x}
            y={POS[key].y + 4}
            textAnchor="middle"
          >
            {key}
          </text>
        </g>
      ))}

      <text
        className={styles.mosaicSmall}
        x={POS.T.x}
        y={POS.T.y + 30}
        textAnchor="middle"
      >
        treatment
      </text>
      <text
        className={styles.mosaicSmall}
        x={POS.Y.x}
        y={POS.Y.y + 30}
        textAnchor="middle"
      >
        outcome
      </text>
      <text
        className={styles.mosaicSmall}
        x={POS.Z.x}
        y={POS.Z.y - 20}
        textAnchor="middle"
      >
        {zName.toLowerCase()}
      </text>
    </svg>
  );
}

export default function CausalStories() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const story = STORIES[active];

  const onKeyDown = (event: React.KeyboardEvent) => {
    let next = active;
    if (event.key === "ArrowRight") next = (active + 1) % STORIES.length;
    else if (event.key === "ArrowLeft")
      next = (active - 1 + STORIES.length) % STORIES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = STORIES.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const arms = [
    { label: ARM_A.name, arm: KIDNEY_STONES.a },
    { label: ARM_B.short, arm: KIDNEY_STONES.b },
  ];

  return (
    <div className={styles.stories}>
      <div className={styles.tablist} role="tablist" aria-label="Causal stories">
        {STORIES.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={index === active}
            aria-controls={`panel-${item.id}`}
            tabIndex={index === active ? 0 : -1}
            className={`${styles.tab} ${index === active ? styles.tabOn : ""}`}
            onClick={() => setActive(index)}
            onKeyDown={onKeyDown}
          >
            {item.tab}
          </button>
        ))}
      </div>

      <div
        className={styles.storyBody}
        role="tabpanel"
        id={`panel-${story.id}`}
        aria-labelledby={`tab-${story.id}`}
        tabIndex={-1}
      >
        <div className={styles.dagBox}>
          <Dag shape={story.id} zName={story.zName} />
          <p className={styles.dagCaption}>
            {story.arrows}
            <br />
            Z = {story.zName.toLowerCase()}
            <br />
            {story.real
              ? "the real story behind these figures"
              : "illustrative story, invented"}
          </p>
        </div>

        <div className={styles.storyText}>
          <p className={styles.storyTag}>
            {story.real ? "What happened" : "Suppose instead"} — Z is a{" "}
            {story.id === "confounder"
              ? "common cause of treatment and outcome"
              : story.id === "mediator"
                ? "consequence of treatment"
                : "common effect of treatment and outcome"}
          </p>
          {story.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}

          <table className={styles.actTable}>
            <caption className={styles.srOnly}>
              The same published counts under this causal story, with the
              comparison the story licenses highlighted.
            </caption>
            <thead>
              <tr>
                <th scope="col">Success</th>
                <th scope="col">{story.strata[0]}</th>
                <th scope="col">{story.strata[1]}</th>
                <th scope="col">all cases</th>
              </tr>
            </thead>
            <tbody>
              {arms.map(({ label, arm }) => {
                const strataClass =
                  story.act === "strata" ? styles.live : styles.dim;
                const pooledClass =
                  story.act === "pooled" ? styles.live : styles.dim;
                return (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td className={strataClass}>{pct(rate(arm.small))}</td>
                    <td className={strataClass}>{pct(rate(arm.large))}</td>
                    <td className={pooledClass}>{pct(overall(arm))}</td>
                  </tr>
                );
              })}
              <tr>
                <th scope="row" className={styles.sub}>
                  cases
                </th>
                <td className={styles.sub}>
                  {KIDNEY_STONES.a.small.total} / {KIDNEY_STONES.b.small.total}
                </td>
                <td className={styles.sub}>
                  {KIDNEY_STONES.a.large.total} / {KIDNEY_STONES.b.large.total}
                </td>
                <td className={styles.sub}>350 / 350</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.dagCaption}>
            Counts unchanged in all three stories: {frac(KIDNEY_STONES.a.small)}{" "}
            and {frac(KIDNEY_STONES.a.large)} for {ARM_A.name.toLowerCase()},{" "}
            {frac(KIDNEY_STONES.b.small)} and {frac(KIDNEY_STONES.b.large)} for{" "}
            {ARM_B.short}.
          </p>

          <p className={styles.h3} style={{ marginBottom: 0 }}>
            {story.verdict}
          </p>
        </div>
      </div>
    </div>
  );
}
