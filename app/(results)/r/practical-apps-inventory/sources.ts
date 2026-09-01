import type { SourceId } from "./types";

export const SOURCES: Record<
  SourceId,
  { short: string; full: string; verified: boolean }
> = {
  "clp-annex-vi": {
    short: "CLP Annex VI",
    full: "Regulation (EC) No 1272/2008, Annex VI — harmonised classification and labelling. Hazard classes on each bottle are taken from the harmonised entry for that CAS number, not invented.",
    verified: true,
  },
  "prudent-2011": {
    short: "Prudent Practices, 2011",
    full: "National Research Council. Prudent Practices in the Laboratory: Handling and Management of Chemical Hazards, Updated Version. Washington, DC: The National Academies Press, 2011. Chapter 5, Management of Chemicals — store by compatibility class; isolate oxidizing acids; keep water-reactives dry and apart.",
    verified: true,
  },
  "epa-600": {
    short: "EPA-600/2-80-076",
    full: "Hatayama, H.K. et al. A Method for Determining the Compatibility of Hazardous Wastes. EPA-600/2-80-076. U.S. Environmental Protection Agency, 1980. The pairwise reactions used here (oxidizer × flammable solvent; mineral acid × base; oxidizing acid × organic acid; water-reactive × aqueous) are the ones that chart marks as incompatible.",
    verified: true,
  },
  "kelly-1996": {
    short: "Kelly, 1996",
    full: "Kelly, R.J. Review of Safety Guidelines for Peroxidizable Organic Chemicals. Chemical Health & Safety 3(5), 1996, 28–36. Diethyl ether and THF are Group B (hazard on concentration). The paper does not set a statutory discard date.",
    verified: true,
  },
  "reg-273": {
    short: "Reg. (EC) 273/2004",
    full: "Regulation (EC) No 273/2004 on drug precursors, as amended. Category 2 includes potassium permanganate and iodine; Category 3 includes acetone, hydrochloric acid, sulfuric acid, toluene and diethyl ether. Movements of these substances need a reconstructible record.",
    verified: true,
  },
  "epp-2023": {
    short: "EPP 2023",
    full: "The Control of Explosives Precursors and Poisons Regulations 2023 (UK). Hydrogen peroxide, nitric acid, sulfuric acid and acetone are regulated explosives precursors. A teaching store still has to account for them.",
    verified: true,
  },
  hsg51: {
    short: "HSE HSG51",
    full: "HSE. The storage of flammable liquids in containers, HSG51 (2nd ed., 2015). Cabinet working capacities in this store are modelled on typical 30-minute fire-rated cabinets discussed there — they are not a survey of a real room.",
    verified: true,
  },
  departmental: {
    short: "Unverified — departmental",
    full: "A local convention of this constructed store, not a published limit. Marked wherever a number is ours: opened-ether test at 180 days, course consumption, timetable dates, cabinet litre ratings, stock on the shelf, and the budget line.",
    verified: false,
  },
};

export const GROUP_LABEL: Record<string, string> = {
  flammable: "Flammable liquid",
  "organic-acid": "Organic acid",
  "mineral-acid": "Mineral acid",
  "oxidizing-acid": "Oxidizing acid",
  base: "Base",
  oxidizer: "Oxidizer",
  toxic: "Toxic / CMR",
  "water-reactive": "Water-reactive",
  general: "General reagent",
};

export const GROUP_SHORT: Record<string, string> = {
  flammable: "Flam",
  "organic-acid": "OrgAc",
  "mineral-acid": "MinAc",
  "oxidizing-acid": "OxAc",
  base: "Base",
  oxidizer: "Ox",
  toxic: "Tox",
  "water-reactive": "H₂O×",
  general: "Gen",
};

export const GROUPS = [
  "flammable",
  "organic-acid",
  "mineral-acid",
  "oxidizing-acid",
  "base",
  "oxidizer",
  "toxic",
  "water-reactive",
  "general",
] as const;
