"use client";

/**
 * Book an hour. The only thing the form does is keep a slot on this device.
 * Centres, days and times are sample fixtures, labelled as such. A second
 * name books a chair beside you — the bring-someone mechanic from the other
 * end.
 */
import { useMemo, useState, useSyncExternalStore } from "react";

import { CENTRES, SLOT_HOURS, formatDay } from "./data";
import type { Elig } from "./Check";
import s from "./hour.module.css";

const STORE = "onehour.booking";

export type Booking = {
  name: string;
  plus: string;
  centre: string;
  day: string;
  slot: string;
  reach: string;
  made: string;
};

type Props = {
  elig: Elig;
  plusName: string;
};

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: Booking | null = null;

function emit() {
  listeners.forEach((listen) => listen());
}

function subscribe(listen: () => void) {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

function readBooking(): Booking | null {
  try {
    const raw = window.localStorage.getItem(STORE);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    cached = raw ? (JSON.parse(raw) as Booking) : null;
    return cached;
  } catch {
    cachedRaw = null;
    cached = null;
    return null;
  }
}

function writeBooking(next: Booking | null) {
  try {
    if (next) window.localStorage.setItem(STORE, JSON.stringify(next));
    else window.localStorage.removeItem(STORE);
  } catch {
    /* Confirmation is already on screen. */
  }
  cachedRaw = undefined;
  emit();
}

function upcomingDays(count: number): string[] {
  const days: string[] = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  for (let i = 1; i <= count + 4 && days.length < count; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dow = date.getDay();
    if (dow === 0) continue;
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

function slotsFor(centreId: string, iso: string): string[] {
  const date = new Date(`${iso}T12:00:00`);
  const dow = date.getDay();
  const centre = CENTRES.find((row) => row.id === centreId) ?? CENTRES[0];
  return SLOT_HOURS.filter((hour) => {
    const n = Number(hour.slice(0, 2));
    if (centre.id === "campus" && (dow === 6 || n < 12)) return false;
    if (centre.id === "market" && (dow === 6 || n < 15)) return false;
    if (centre.id === "riverside" && n >= 18) return false;
    if (centre.id === "station" && (dow === 1 || dow === 2 || dow === 3)) return false;
    return true;
  });
}

export default function Book({ elig, plusName }: Props) {
  const days = useMemo(() => upcomingDays(7), []);
  const firstDay = days[0] ?? "";
  const [name, setName] = useState("");
  const [plusEdit, setPlusEdit] = useState<string | null>(null);
  const [centre, setCentre] = useState(CENTRES[0].id);
  const [day, setDay] = useState(firstDay);
  const [slot, setSlot] = useState(
    () => slotsFor(CENTRES[0].id, firstDay)[0] ?? "",
  );
  const [reach, setReach] = useState("");
  const [error, setError] = useState<string | null>(null);
  const booking = useSyncExternalStore(subscribe, readBooking, () => null);

  const plus = plusEdit ?? plusName;
  const hours = slotsFor(centre, day);

  const pickCentre = (id: string) => {
    setCentre(id);
    const next = slotsFor(id, day);
    if (!next.includes(slot)) setSlot(next[0] ?? "");
  };

  const pickDay = (iso: string) => {
    setDay(iso);
    const next = slotsFor(centre, iso);
    if (!next.includes(slot)) setSlot(next[0] ?? "");
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("A name for the appointment.");
      return;
    }
    if (!day || !slot) {
      setError("A day and an hour.");
      return;
    }
    if (!reach.trim()) {
      setError("A phone number or an email — one way to reach you. It stays here.");
      return;
    }
    writeBooking({
      name: name.trim(),
      plus: plus.trim(),
      centre,
      day,
      slot,
      reach: reach.trim(),
      made: new Date().toISOString(),
    });
    setError(null);
  };

  const downloadIcs = () => {
    if (!booking) return;
    const place = CENTRES.find((row) => row.id === booking.centre) ?? CENTRES[0];
    const start = new Date(`${booking.day}T${booking.slot}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const stamp = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//One Hour//EN",
      "BEGIN:VEVENT",
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:Blood donation — ${place.name}`,
      `DESCRIPTION:One hour. ${booking.plus ? `With ${booking.plus}. ` : ""}Nothing was sent from the page; add this to your own calendar.`,
      `LOCATION:${place.name}, ${place.where}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "one-hour.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (booking) {
    const place = CENTRES.find((row) => row.id === booking.centre) ?? CENTRES[0];
    return (
      <div className={s.confirm}>
        <h3>The hour is yours. On this device.</h3>
        <p className={s.measure}>
          Nothing was sent. There is no national service behind this page. Keep
          the time, or put it in your own calendar, and book it again on the
          real service when you mean it.
        </p>
        <dl>
          <div>
            <dt>When</dt>
            <dd>
              {formatDay(booking.day)} at {booking.slot} — one hour
            </dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>
              {place.name}, {place.where}
            </dd>
          </div>
          <div>
            <dt>Who</dt>
            <dd>
              {booking.name}
              {booking.plus ? ` and ${booking.plus}` : ""}
            </dd>
          </div>
          <div>
            <dt>Reach</dt>
            <dd>{booking.reach}</dd>
          </div>
        </dl>
        <div className={s.heroActs}>
          <button type="button" className={s.primary} onClick={downloadIcs}>
            Add to calendar
          </button>
          <button type="button" className={s.secondary} onClick={() => writeBooking(null)}>
            Change the hour
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={submit}>
      {elig === "not-today" ? (
        <p className={s.measure}>
          You cannot give this week. You can still hold an hour for someone
          else, or put a later week in the calendar so it exists.
        </p>
      ) : null}
      <p className={s.note}>
        Centres and times below are invented fixtures for this page, not a live
        diary.
      </p>
      <div className={s.centres} role="group" aria-label="Centre">
        {CENTRES.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`${s.centre} ${centre === row.id ? s.centreOn : ""}`}
            onClick={() => pickCentre(row.id)}
            aria-pressed={centre === row.id}
          >
            {row.name}
            <small>
              {row.where} · {row.hours}
            </small>
          </button>
        ))}
      </div>
      <div>
        <p className={s.label}>Day</p>
        <div className={s.days} role="group" aria-label="Day">
          {days.map((iso) => (
            <button
              key={iso}
              type="button"
              className={`${s.pick} ${day === iso ? s.pickOn : ""}`}
              onClick={() => pickDay(iso)}
              aria-pressed={day === iso}
            >
              {formatDay(iso)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className={s.label}>Hour</p>
        <div className={s.slots} role="group" aria-label="Hour">
          {hours.length ? (
            hours.map((hour) => (
              <button
                key={hour}
                type="button"
                className={`${s.slot} ${slot === hour ? s.slotOn : ""}`}
                onClick={() => setSlot(hour)}
                aria-pressed={slot === hour}
              >
                {hour}
              </button>
            ))
          ) : (
            <p className={s.note}>That centre is closed on this day. Pick another.</p>
          )}
        </div>
      </div>
      <label className={s.label}>
        Your name
        <input
          className={s.field}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </label>
      <label className={s.label}>
        Someone next to you <span>optional</span>
        <input
          className={s.field}
          value={plus}
          onChange={(e) => setPlusEdit(e.target.value)}
          placeholder="Their first name"
        />
      </label>
      <label className={s.label}>
        Phone or email <span>stays on this device</span>
        <input
          className={s.field}
          value={reach}
          onChange={(e) => setReach(e.target.value)}
          autoComplete="email"
        />
      </label>
      {error ? <p className={s.err}>{error}</p> : null}
      <button type="submit" className={s.primary}>
        Hold this hour
      </button>
    </form>
  );
}
