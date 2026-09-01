"use client";

/**
 * Crowded rooms are the complaint. An audio demo would be the obvious move
 * and the wrong one: this audience is here because hearing is already hard,
 * and a browser speaker is not a restaurant.
 *
 * So the room is a plan of a table. Six seats, six overlapping remarks.
 * Facing someone brings their line forward and lets the others recede. The
 * three modes change how many seats stay with you. It is a picture of a
 * tendency, not a measurement, and the copy says so.
 */
import { useId, useState } from "react";

import { MODES, SEATS, type RoomMode } from "./data";
import s from "./kestrel.module.css";

function held(mode: RoomMode, facing: string, seat: string): "self" | "held" | "far" {
  if (seat === "f") return "self";
  if (seat === facing) return "held";
  if (mode === "quiet") return "held";
  if (mode === "table") {
    const nextTo: Record<string, string[]> = {
      a: ["b", "e"],
      b: ["a", "c"],
      c: ["b", "d"],
      d: ["c", "e"],
      e: ["d", "a"],
    };
    return nextTo[facing]?.includes(seat) ? "held" : "far";
  }
  return "far";
}

export default function Room() {
  const id = useId();
  const [facing, setFacing] = useState("c");
  const [mode, setMode] = useState<RoomMode>("face");

  const current = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <div className={s.room}>
      <div className={s.roomPlan} role="img" aria-label="A table of six. You sit at the left.">
        <svg viewBox="0 0 100 100" className={s.roomSvg} aria-hidden="true">
          <rect x="30" y="30" width="40" height="40" rx="1.2" fill="#dfe1db" stroke="#8a8e87" strokeWidth="0.6" />
          <ellipse cx="50" cy="50" rx="11" ry="8" fill="#eef0ec" stroke="#c5c8c1" strokeWidth="0.5" />
          {SEATS.map((seat) => {
            const state = held(mode, facing, seat.id);
            const fill =
              state === "self" ? "#141613" : state === "held" ? "#8f6a22" : "#c5c8c1";
            return (
              <g key={seat.id}>
                <circle cx={seat.x} cy={seat.y} r="5.2" fill={fill} />
                <text
                  x={seat.x}
                  y={seat.y + 1.4}
                  textAnchor="middle"
                  fill={state === "far" ? "#3a3d38" : "#faf8f3"}
                  fontSize="4.2"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {seat.id === "f" ? "Y" : seat.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={s.roomTalk}>
        {SEATS.map((seat) => {
          const state = held(mode, facing, seat.id);
          return (
            <p
              key={seat.id}
              className={
                state === "self"
                  ? s.talkSelf
                  : state === "held"
                    ? s.talkHeld
                    : s.talkFar
              }
            >
              <span className={s.talkWho}>{seat.label}</span>
              {seat.line}
            </p>
          );
        })}
      </div>

      <fieldset className={s.choiceSet}>
        <legend>Who you are facing</legend>
        <div className={s.choiceRow}>
          {SEATS.filter((seat) => seat.id !== "f").map((seat) => (
            <label key={seat.id} className={s.choice}>
              <input
                type="radio"
                name={`${id}-face`}
                checked={facing === seat.id}
                suppressHydrationWarning
                onChange={() => {
                  setFacing(seat.id);
                }}
              />
              <span>Seat {seat.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={s.choiceSet}>
        <legend>How the microphones sit</legend>
        <div className={s.choiceRow}>
          {MODES.map((item) => (
            <label key={item.id} className={s.choice}>
              <input
                type="radio"
                name={`${id}-mode`}
                checked={mode === item.id}
                suppressHydrationWarning
                onChange={() => {
                  setMode(item.id);
                }}
              />
              <span>{item.name}</span>
            </label>
          ))}
        </div>
        <p className={s.choiceNote}>{current.blurb}</p>
      </fieldset>

      <p className={s.caption}>
        A picture of a tendency, not a measurement. The device makes the voice
        you are facing easier to follow than the table behind you. It does not
        restore a quiet room, and it does not restore the hearing you had at
        thirty. That is the most we will claim.
      </p>
    </div>
  );
}
