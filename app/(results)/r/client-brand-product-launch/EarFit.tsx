"use client";

/**
 * Fit is decided at the appointment, not on a website. This is not a
 * configurator. It shows the three wire lengths and the three tips so that
 * someone arriving with a spouse knows what will be chosen, and why we will
 * not sell a size from a screen.
 */
import { useState } from "react";

import { TIPS, WIRES, type Tip, type WireLength } from "./data";
import s from "./kestrel.module.css";

function EarMeasure({ wire }: { wire: WireLength }) {
  const drop = wire.id === "1" ? 38 : wire.id === "2" ? 56 : 76;
  const tipY = 70 + drop;
  return (
    <svg
      className={s.figureSvg}
      viewBox="0 0 200 250"
      role="img"
      aria-label={`Tube ${wire.name}, ${wire.mm}, drawn on an ear.`}
    >
      <g
        fill="none"
        stroke="#5c605a"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M82 30c18-20 50-24 72-8 20 14 26 40 22 68-3 20-8 38-4 56 2 18-8 38-24 46-16 8-38 6-52-6-14-10-22-26-26-42" />
        <path d="M94 64c12-14 32-16 46-4 12 10 14 28 10 44" />
        <path d="M114 108c8 4 18 4 24-4" />
      </g>
      <g transform="translate(58 46) rotate(-14)">
        <rect
          x="0"
          y="0"
          width="22"
          height="58"
          rx="9"
          fill="#9aa0a4"
          stroke="#5f6468"
          strokeWidth="1"
        />
        <circle cx="11" cy="14" r="1.6" fill="#5f6468" />
        <circle cx="11" cy="24" r="1.6" fill="#5f6468" />
      </g>
      <path
        d={`M84 68c16 10 24 22 28 ${drop - 8}`}
        fill="none"
        stroke="#8f6a22"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <ellipse
        cx="114"
        cy={tipY}
        rx="7"
        ry="9"
        fill="#c4963c"
        stroke="#6a480e"
        strokeWidth="0.8"
      />
      <path d={`M48 52v${drop + 28}`} stroke="#141613" strokeWidth="0.9" />
      <path d="M44 52h8" stroke="#141613" strokeWidth="0.9" />
      <path d={`M44 ${52 + drop + 28}h8`} stroke="#141613" strokeWidth="0.9" />
      <text
        x="40"
        y={66 + drop / 2}
        textAnchor="end"
        fill="#141613"
        fontSize="12"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {wire.mm}
      </text>
    </svg>
  );
}

export default function EarFit() {
  const [wire, setWire] = useState<WireLength>(WIRES[1]);
  const [tip, setTip] = useState<Tip>(TIPS[1]);

  return (
    <div className={s.fit}>
      <div className={s.fitDraw}>
        <EarMeasure wire={wire} />
      </div>
      <div>
        <p className={s.kicker}>The tube</p>
        <div className={s.choiceRow} role="group" aria-label="Tube length">
          {WIRES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={s.chip}
              aria-pressed={item.id === wire.id}
              onClick={() => {
                setWire(item);
              }}
            >
              {item.name}
              <span>{item.mm}</span>
            </button>
          ))}
        </div>
        <p className={s.prose}>{wire.who}</p>

        <p className={s.kicker}>The tip</p>
        <div className={s.choiceRow} role="group" aria-label="Ear tip">
          {TIPS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={s.chip}
              aria-pressed={item.id === tip.id}
              onClick={() => {
                setTip(item);
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <p className={s.prose}>
          <strong>{tip.for}</strong> {tip.note}
        </p>
        <p className={s.caption}>
          Left and right are different pieces: the microphones face forward.
          We will not sell you a length from this page. The fitting is
          seventy-five minutes with an audiologist, and that is where the size
          is decided.
        </p>
      </div>
    </div>
  );
}
