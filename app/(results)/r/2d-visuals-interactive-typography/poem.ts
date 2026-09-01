/**
 * The sheet's only text. Short enough that hunting it with a lamp is
 * proportionate, and written for the mechanic: the words are about a mark
 * that will not speak until light is carried.
 *
 * Original to this piece, so the impression is not a quotation.
 */
export const STANZAS: readonly (readonly string[])[] = [
  ["The type has already left."],
  ["What remains is a valley", "the depth of a thumbnail."],
  [
    "Only a light arriving late,",
    "and from the side, will admit",
    "that anything was said.",
  ],
];

export const LINES: readonly string[] = STANZAS.flat();
