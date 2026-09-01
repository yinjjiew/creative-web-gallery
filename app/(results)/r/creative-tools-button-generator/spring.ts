/**
 * One-dimensional mass-spring. Semi-implicit Euler at 120 Hz.
 * The same step is inlined into the exported module.
 */

import {
  busyNeed,
  coeffs,
  detentForce,
  holdNeed,
  type Recipe,
  type Role,
} from "./feel";

export type Body = {
  x: number;
  v: number;
  latched: boolean;
  hold: number;
  busyLeft: number;
  stroke: boolean;
  fired: boolean;
};

export type Drive = {
  held: boolean;
  depth: number;
};

export type Tick = {
  commit: boolean;
  fire: boolean;
  velocity: number;
};

export function freshBody(): Body {
  return {
    x: 0,
    v: 0,
    latched: false,
    hold: 0,
    busyLeft: 0,
    stroke: false,
    fired: false,
  };
}

function restOf(body: Body, role: Role): number {
  if (role === "latch" && body.latched) return 0.78;
  return 0;
}

function targetOf(body: Body, role: Role, drive: Drive): number {
  if (role === "dead") return 0;
  if (role === "busy" && body.busyLeft > 0) {
    return body.busyLeft > 0.28 ? 0.86 : 0;
  }
  if (role === "latch" && body.latched) {
    if (!drive.held) return 0.78;
    return 0.78 + drive.depth * 0.22;
  }
  if (!drive.held) return restOf(body, role);
  return drive.depth;
}

export function step(
  body: Body,
  recipe: Recipe,
  role: Role,
  drive: Drive,
  dt: number,
  reduced: boolean
): Tick {
  const event: Tick = { commit: false, fire: false, velocity: 0 };
  if (role === "dead") {
    body.x = 0;
    body.v = 0;
    return event;
  }

  if (body.busyLeft > 0) {
    body.busyLeft = Math.max(0, body.busyLeft - dt);
    drive = { held: false, depth: 0 };
  }

  const { k, m, c, preloadF } = coeffs(recipe);
  const target = targetOf(body, role, drive);
  const prev = body.x;

  if (reduced) {
    body.x = target;
    body.v = 0;
  } else {
    let F = -k * (body.x - target) - c * body.v + detentForce(body.x, recipe, k);

    const atRest =
      !drive.held &&
      body.x < restOf(body, role) + 0.04 &&
      Math.abs(body.v) < 0.22 &&
      !body.latched;

    if (atRest) {
      body.x = restOf(body, role);
      body.v = 0;
      F = 0;
    } else if (
      drive.held &&
      body.x < 0.02 &&
      F > 0 &&
      F < preloadF &&
      !body.latched
    ) {
      F = 0;
      body.v = 0;
    }

    body.v += (F / m) * dt;
    body.x += body.v * dt;

    if (body.x > 1.08) {
      body.x = 1.08;
      body.v *= -0.12;
    }
    if (body.x < -0.04) {
      body.x = -0.04;
      body.v *= -0.08;
    }
  }

  const rising = body.x >= recipe.commit && prev < recipe.commit;

  if (role === "latch" && body.latched) {
    if (drive.held && body.x >= 0.94 && !body.stroke) {
      body.latched = false;
      body.stroke = true;
      event.commit = true;
      event.velocity = Math.abs(body.v);
    }
    if (!drive.held) body.stroke = false;
    return event;
  }

  if (rising && !body.stroke) {
    body.stroke = true;
    event.commit = true;
    event.velocity = Math.max(0.15, Math.abs(body.v));

    if (role === "momentary") {
      event.fire = true;
      body.fired = true;
    } else if (role === "latch") {
      body.latched = true;
      event.fire = true;
      body.fired = true;
    } else if (role === "busy") {
      event.fire = true;
      body.fired = true;
      body.busyLeft = busyNeed(recipe);
    }
  }

  if (role === "hold") {
    if (drive.held && body.x >= recipe.commit) {
      body.hold += dt;
      if (!body.fired && body.hold >= holdNeed(recipe)) {
        event.fire = true;
        body.fired = true;
        if (!event.commit) {
          event.commit = true;
          event.velocity = Math.max(0.15, Math.abs(body.v));
        }
      }
    } else if (!drive.held) {
      body.hold = 0;
    }
  }

  if (!drive.held && body.x < recipe.commit * 0.55) {
    body.stroke = false;
    body.fired = false;
    if (role === "hold") body.hold = 0;
  }

  return event;
}

export function holdProgress(body: Body, recipe: Recipe): number {
  const need = holdNeed(recipe);
  return need <= 0 ? 0 : Math.min(1, body.hold / need);
}
