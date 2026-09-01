"use client";

import { useMemo, useState } from "react";

import { searchPlaces, sortForRegister } from "./catalog";
import { EmptyRegister, RegisterList } from "./Register";
import s from "./reaches.module.css";

export function Search({ initialQ = "" }: { initialQ?: string }) {
  const [q, setQ] = useState(initialQ);
  const results = useMemo(() => sortForRegister(searchPlaces(q)), [q]);

  return (
    <div className={s.search}>
      <form
        className={s.searchForm}
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <label htmlFor="reach-q" className={s.searchLabel}>
          Find a reach by name, water, county, or hazard
        </label>
        <div className={s.searchRow}>
          <input
            id="reach-q"
            name="q"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="Hobb’s, Lynher, weir, Norfolk…"
            className={s.searchInput}
          />
          <button type="submit" className={s.searchGo}>
            Look up
          </button>
        </div>
      </form>
      {q.trim() ? (
        results.length ? (
          <RegisterList
            places={results}
            caption={`${results.length} reach${results.length === 1 ? "" : "es"} matching “${q.trim()}”, lethal and unassessed first.`}
          />
        ) : (
          <EmptyRegister>
            Nothing in this edition matches “{q.trim()}”. That is a gap in a
            modelled catalogue, not a claim that the water is empty.
          </EmptyRegister>
        )
      ) : (
        <RegisterList
          places={results}
          caption={`${results.length} reaches in this edition, lethal and unassessed first.`}
        />
      )}
    </div>
  );
}
