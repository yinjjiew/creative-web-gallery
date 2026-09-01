/**
 * A starter set cut on the same 24-unit body. Geometry only — the family
 * supplies the stroke. These twelve are the kind of toolbar a product
 * actually ships, which is the fight the tool is built to win.
 */

import { type Mark, type Point } from "./marks";
import type { Punch } from "./system";

let seq = 0;
function mid(): string {
  seq += 1;
  return `s${seq}`;
}

function line(a: Point, b: Point): Mark {
  return { id: mid(), kind: "line", a, b };
}
function poly(...points: Point[]): Mark {
  return { id: mid(), kind: "poly", points };
}
function rect(a: Point, b: Point): Mark {
  return { id: mid(), kind: "rect", a, b };
}
function ring(c: Point, r: number): Mark {
  return { id: mid(), kind: "circle", c, r };
}

function punch(id: string, name: string, marks: Mark[]): Punch {
  return { id, name, marks };
}

export const SEED: Punch[] = [
  punch("house", "House", [
    poly([5, 12], [12, 6], [19, 12]),
    poly([7, 12], [7, 19], [17, 19], [17, 12]),
    line([12, 19], [12, 15]),
  ]),
  punch("search", "Search", [ring([10, 10], 5), line([14, 14], [19, 19])]),
  punch("plus", "Plus", [line([6, 12], [18, 12]), line([12, 6], [12, 18])]),
  punch("minus", "Minus", [line([6, 12], [18, 12])]),
  punch("close", "Close", [line([7, 7], [17, 17]), line([17, 7], [7, 17])]),
  punch("check", "Check", [poly([6, 12], [10, 17], [18, 7])]),
  punch("chevron", "Chevron", [poly([9, 6], [16, 12], [9, 18])]),
  punch("arrow", "Arrow", [line([5, 12], [17, 12]), poly([13, 7], [18, 12], [13, 17])]),
  punch("menu", "Menu", [
    line([6, 8], [18, 8]),
    line([6, 12], [18, 12]),
    line([6, 16], [18, 16]),
  ]),
  punch("user", "User", [
    ring([12, 8], 3),
    poly([6, 19], [6, 16], [9, 14], [15, 14], [18, 16], [18, 19]),
  ]),
  punch("mail", "Mail", [rect([5, 8], [19, 16]), poly([5, 8], [12, 13], [19, 8])]),
  punch("lock", "Lock", [
    rect([8, 12], [16, 20]),
    poly([9, 12], [9, 8], [12, 6], [15, 8], [15, 12]),
  ]),
];
