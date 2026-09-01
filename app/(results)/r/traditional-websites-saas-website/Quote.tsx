"use client";

import { useId, useState } from "react";

import { gbp, PRICE, quote } from "./data";
import s from "./rota.module.css";

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * The price has to be a number an owner can work out on a receipt. This
 * is that sum, not a configurator: sites times the site fee, plus people
 * actually paid times £3.80.
 */
export default function Quote() {
  const sitesId = useId();
  const paidId = useId();
  const [sites, setSites] = useState(1);
  const [paid, setPaid] = useState(28);
  const q = quote(sites, paid);

  return (
    <form className={s.quote} onSubmit={(e) => e.preventDefault()}>
      <div className={s.quoteFields}>
        <label htmlFor={sitesId}>
          Sites
          <input
            id={sitesId}
            type="number"
            inputMode="numeric"
            min={1}
            max={4}
            step={1}
            value={sites}
            onChange={(e) => setSites(clamp(Number(e.target.value), 1, 4))}
          />
        </label>
        <label htmlFor={paidId}>
          People paid this month
          <input
            id={paidId}
            type="number"
            inputMode="numeric"
            min={0}
            max={80}
            step={1}
            value={paid}
            onChange={(e) => setPaid(clamp(Number(e.target.value), 0, 80))}
          />
        </label>
      </div>
      <p className={s.quoteSum} aria-live="polite">
        {gbp(PRICE.site)} × {sites} {sites === 1 ? "site" : "sites"}
        <span aria-hidden="true"> + </span>
        {gbp(PRICE.person)} × {paid} {paid === 1 ? "person" : "people"}
        <span aria-hidden="true"> = </span>
        <strong>{gbp(q.total)} this month</strong>
      </p>
      <p className={s.note}>
        People on the books who were not paid do not appear in the second
        number. Leavers waiting on a P45, or a chef on unpaid leave, are free
        after thirty days. We will not sell a fifth site; that is a different
        product.
      </p>
    </form>
  );
}
