"use client";

/**
 * Small local pieces. Not a design system — the gallery forbids sharing one, and
 * these exist only because a page about money needs one way of setting a figure
 * and one way of marking an estimate, applied without exception.
 */
import { useId, type ReactNode } from "react";

import { money, type Pence } from "./money";
import s from "./runway.module.css";

/**
 * A money figure. The currency mark is a separate span so that a column of these
 * has its decimal points on one vertical line regardless of how many digits each
 * amount happens to carry.
 */
export function Fig({
  value,
  sign = "none",
  tone,
  size = "body",
}: {
  value: Pence;
  /** `always` puts an explicit + or − in front, for a column of movements. */
  sign?: "none" | "always" | "minus";
  tone?: "ink" | "muted" | "claret" | "pine" | "tax";
  size?: "body" | "small" | "large" | "huge";
}) {
  const negative = value < 0;
  const magnitude = Math.abs(value);
  const mark = sign === "always" ? (negative ? "−" : "+") : sign === "minus" ? "−" : negative ? "−" : "";
  return (
    <span
      className={`${s.fig} ${s[`fig_${size}`]} ${tone ? s[`tone_${tone}`] : ""}`}
      data-negative={negative ? "" : undefined}
    >
      <span className={s.figMark} aria-hidden={mark === "" ? "true" : undefined}>
        {mark}
      </span>
      <span className={s.figCurrency}>£</span>
      <span className={s.figDigits}>{money(magnitude)}</span>
    </span>
  );
}

export type Confidence = "known" | "observed" | "thin" | "none" | "projected";

const CONFIDENCE_WORD: Record<Confidence, string> = {
  known: "known",
  observed: "estimated",
  thin: "thin evidence",
  none: "a guess",
  projected: "projected",
};

const CONFIDENCE_MEANING: Record<Confidence, string> = {
  known: "The date and the amount are both confirmed. Nothing here is inferred.",
  observed:
    "The date is inferred from three or more of this client's own paid invoices. The amount is confirmed.",
  thin: "Fewer than three paid invoices to judge by, so the window is deliberately wide.",
  none: "No payment history at all. This is a guess from the contract terms, not an estimate.",
  projected: "Depends on a tax year that has not closed, so it will move.",
};

/** Marks a figure as inferred, in the same way every time and never silently. */
export function Mark({ level }: { level: Confidence }) {
  return (
    <span className={`${s.mark} ${s[`mark_${level}`]}`} title={CONFIDENCE_MEANING[level]}>
      {CONFIDENCE_WORD[level]}
    </span>
  );
}

export function Rail({
  label,
  children,
  aside,
}: {
  label: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={s.rail}>
      <span className={s.railLabel}>{label}</span>
      {children}
      {aside ? <span className={s.railAside}>{aside}</span> : null}
    </div>
  );
}

export type Choice<T extends string> = { value: T; label: string; hint?: string };

/**
 * A radio group that looks like one control. Radios rather than buttons so that
 * arrow keys move through the options and a screen reader announces the set.
 */
export function Segmented<T extends string>({
  legend,
  choices,
  value,
  onChange,
  wide = false,
}: {
  legend: string;
  choices: Choice<T>[];
  value: T;
  onChange: (next: T) => void;
  wide?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className={`${s.segmented} ${wide ? s.segmentedWide : ""}`}>
      <legend className={s.segmentedLegend}>{legend}</legend>
      <div className={s.segmentedRow}>
        {choices.map((choice) => (
          <label key={choice.value} className={s.segment} data-on={choice.value === value ? "" : undefined}>
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={choice.value === value}
              style={{ caretColor: "transparent" }}
              onChange={() => {
                onChange(choice.value);
              }}
            />
            <span className={s.segmentLabel}>{choice.label}</span>
            {choice.hint ? <span className={s.segmentHint}>{choice.hint}</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Switch({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className={s.switch} data-on={checked ? "" : undefined}>
      <input
        type="checkbox"
        checked={checked}
        style={{ caretColor: "transparent" }}
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
      />
      <span className={s.switchBox} aria-hidden="true" />
      <span className={s.switchText}>
        <span className={s.switchLabel}>{label}</span>
        {detail ? <span className={s.switchDetail}>{detail}</span> : null}
      </span>
    </label>
  );
}

/** A disclosure that keeps its heading legible when closed. */
export function Working({
  title,
  summary,
  children,
  open = false,
}: {
  title: string;
  summary: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className={s.working} open={open}>
      <summary>
        <span className={s.workingTitle}>{title}</span>
        <span className={s.workingSummary}>{summary}</span>
      </summary>
      <div className={s.workingBody}>{children}</div>
    </details>
  );
}
