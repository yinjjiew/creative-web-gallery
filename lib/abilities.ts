import { ABILITIES, type Ability } from "./types";

/**
 * URL slugs for abilities.
 *
 * The tag vocabulary contains slashes, spaces and ampersands ("Visual Design /
 * Taste", "State & Data"), none of which survive a path segment intact. The map
 * is derived from the vocabulary rather than written out, so adding a tag cannot
 * leave a missing slug behind.
 */
function toSlug(ability: string) {
  return ability
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BY_ABILITY = new Map<Ability, string>(
  ABILITIES.map((ability) => [ability, toSlug(ability)])
);

const BY_SLUG = new Map<string, Ability>(
  ABILITIES.map((ability) => [toSlug(ability), ability])
);

export function abilitySlug(ability: Ability) {
  return BY_ABILITY.get(ability) ?? toSlug(ability);
}

export function abilityFromSlug(slug: string) {
  return BY_SLUG.get(slug);
}

export const ABILITY_SLUGS = [...BY_SLUG.keys()];
