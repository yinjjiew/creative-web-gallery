/**
 * The coat register: individual coats by number, their repair history, and the
 * mill's record of its own mistakes.
 *
 * PROVENANCE. Invented, like the rest of this reference implementation. The
 * shape of the record is the argument being made — a coat that can be looked up
 * by the number sewn inside it, with every repair dated and priced, is what
 * "traceable" has to mean if it is to mean anything — so the register is
 * modelled as a real one would be, including entries the mill would rather not
 * publish.
 */

export type RepairEntry = {
  date: string;
  what: string;
  /** Pounds charged to the owner. 0 means the mill paid. */
  charge: number;
  /** Why it was free, or why it was not. */
  basis: string;
};

export type CoatRecord = {
  serial: string;
  lotCode: string;
  farm: string;
  clip: number;
  size: string;
  /** Cloth piece and the metre mark this coat was cut from. */
  piece: string;
  weaver: string;
  maker: string;
  dispatched: string;
  /** Where the coat lives. No names or addresses are published. */
  whereabouts: string;
  repairs: RepairEntry[];
  /** Anything the mill wants to say about this particular coat. */
  note?: string;
};

export const COATS: CoatRecord[] = [
  {
    serial: "AW/2013/0061",
    lotCode: "AW/2013/ARH",
    farm: "Ariundle Head",
    clip: 2013,
    size: "46",
    piece: "Piece 2, at 61.4 m",
    weaver: "J. Ross",
    maker: "Bowmont Workshop, Hawick",
    dispatched: "14 October 2013",
    whereabouts: "Argyll. In service. Thirteenth winter.",
    note: "The oldest coat still coming back to us with the same owner. The shoulders and the outer sleeves have gone rust-brown, which is what undyed Hebridean does, and the owner has declined twice to have anything done about it.",
    repairs: [
      {
        date: "9 March 2016",
        what: "Re-proofed. Buttons checked, one restitched.",
        charge: 0,
        basis: "Re-proofing is free for the life of the coat.",
      },
      {
        date: "2 February 2018",
        what: "Sleeves shortened 20 mm, cuffs rebound in the same cloth.",
        charge: 0,
        basis: "First alteration is included, whenever it is asked for.",
      },
      {
        date: "27 November 2019",
        what: "Body lining renewed. Original cotton drill had worn through at the seat.",
        charge: 96,
        basis: "Lining is a wearing part. Charged at cost of cloth and labour.",
      },
      {
        date: "5 October 2021",
        what: "Re-proofed. Left pocket bag replaced.",
        charge: 0,
        basis: "Pocket bag seam had failed at the bar tack. Our stitching, our cost.",
      },
      {
        date: "18 January 2024",
        what: "Both cuffs rebound. 240 mm tear in the right forearm darned from the 2013 reserve.",
        charge: 74,
        basis: "Tear was a barbed wire fence. Darned at cost; the cloth came free from the reserve.",
      },
      {
        date: "3 March 2026",
        what: "Re-proofed. Collar stand pressed. Nothing else needed.",
        charge: 0,
        basis: "Re-proofing is free for the life of the coat.",
      },
    ],
  },
  {
    serial: "AW/2016/0142",
    lotCode: "AW/2016/CMD",
    farm: "Camas Dubh",
    clip: 2016,
    size: "44",
    piece: "Piece 5, at 212.0 m",
    weaver: "A. Buchan",
    maker: "Bowmont Workshop, Hawick",
    dispatched: "3 November 2016",
    whereabouts: "Northumberland. In service.",
    repairs: [
      {
        date: "21 April 2019",
        what: "Re-proofed.",
        charge: 0,
        basis: "Re-proofing is free for the life of the coat.",
      },
      {
        date: "14 September 2021",
        what: "Body and sleeve lining renewed.",
        charge: 86,
        basis: "Lining is a wearing part. Charged at cost of cloth and labour.",
      },
      {
        date: "2 June 2023",
        what: "Both cuffs rebound, 30 mm turn.",
        charge: 64,
        basis: "Cuff wear at seven years is ordinary wear, not a fault. Charged at cost.",
      },
      {
        date: "11 November 2024",
        what: "Re-proofed. Two horn buttons replaced.",
        charge: 0,
        basis: "Buttons are replaced free, as many times as it takes.",
      },
      {
        date: "30 January 2026",
        what: "Right pocket bag replaced.",
        charge: 0,
        basis: "Seam failure at the bar tack. Our stitching, our cost.",
      },
    ],
  },
  {
    serial: "AW/2019/0288",
    lotCode: "AW/2019/TBG",
    farm: "Torr Beag",
    clip: 2019,
    size: "40",
    piece: "Piece 1, at 88.6 m",
    weaver: "A. Buchan",
    maker: "Bowmont Workshop, Hawick",
    dispatched: "22 February 2020",
    whereabouts: "Greater London. In service.",
    repairs: [
      {
        date: "8 October 2022",
        what: "Re-proofed.",
        charge: 0,
        basis: "Re-proofing is free for the life of the coat.",
      },
      {
        date: "17 July 2023",
        what: "Moth damage: four grazed patches on the left shoulder and upper sleeve, rewoven by hand from the 2019 reserve. Eleven hours' work.",
        charge: 148,
        basis: "Moth is not a fault in the coat. Charged at cost, quoted before we started, and the owner was told the alternative was to live with it.",
      },
      {
        date: "4 April 2026",
        what: "Re-proofed. One button replaced.",
        charge: 0,
        basis: "Re-proofing is free for the life of the coat.",
      },
    ],
  },
  {
    serial: "AW/2021/0139",
    lotCode: "AW/2021/CNF",
    farm: "Cnoc Fhiar",
    clip: 2021,
    size: "42",
    piece: "Piece 3, at 104.2 m",
    weaver: "J. Ross",
    maker: "Bowmont Workshop, Hawick",
    dispatched: "9 December 2021",
    whereabouts: "Fife. In service.",
    note: "One of the fourteen coats from the 2021 Cnoc Fhiar cloth. That piece was under-milled and the cuffs wore through in under two years. See the register of faults below. We wrote to all fourteen owners before any of them wrote to us.",
    repairs: [
      {
        date: "3 May 2023",
        what: "Cuffs and front edges rebound in 2019 Camas Dubh cloth, a shade darker than the coat. Offered as an alternative to a full refund.",
        charge: 0,
        basis: "Our finishing error. Our cost, including carriage both ways.",
      },
      {
        date: "12 February 2025",
        what: "Re-proofed. Cuffs inspected, no further wear.",
        charge: 0,
        basis: "Re-proofing is free for the life of the coat.",
      },
    ],
  },
  {
    serial: "AW/2024/0331",
    lotCode: "AW/2024/CMD",
    farm: "Camas Dubh",
    clip: 2024,
    size: "38",
    piece: "Piece 4, at 156.8 m",
    weaver: "R. Sinclair",
    maker: "Bowmont Workshop, Hawick",
    dispatched: "6 April 2025",
    whereabouts: "Co. Mayo. In service.",
    note: "Nothing has happened to this coat yet, which is the usual state of a coat that is two years old. It is in the register so that the register is not only made of interesting cases.",
    repairs: [
      {
        date: "19 May 2026",
        what: "Re-proofed at the first year. Nothing else.",
        charge: 0,
        basis: "Re-proofing is free for the life of the coat.",
      },
    ],
  },
  {
    serial: "AW/2010/0007",
    lotCode: "AW/2010/CMD",
    farm: "Camas Dubh",
    clip: 2010,
    size: "42",
    piece: "Piece 1, at 14.0 m",
    weaver: "W. Tait",
    maker: "Bowmont Workshop, Hawick",
    dispatched: "Never sold",
    whereabouts: "Kilchoan. Worn daily by the mill manager since 2010.",
    note: "The seventh coat made. It has had four linings, two sets of cuffs, one new collar and about forty re-proofings, and the cloth itself has never been repaired. It hangs on the back of the office door and anyone visiting the mill is welcome to look at it, which is a more useful thing than a photograph of a new one.",
    repairs: [
      {
        date: "2011 onward",
        what: "Re-proofed twice a year, every year. Sixteen years of it.",
        charge: 0,
        basis: "The mill's own coat, so the point is what wears out and when.",
      },
      {
        date: "2014, 2018, 2021, 2025",
        what: "Lining renewed. Roughly every four years at this rate of wear.",
        charge: 0,
        basis: "Recorded so that a buyer can see what a lining actually costs over a lifetime: about £90 every four years.",
      },
      {
        date: "2017 and 2024",
        what: "Cuffs rebound. Seven years each time.",
        charge: 0,
        basis: "Cuffs are the first part of the cloth to go, on every coat we have ever seen back.",
      },
      {
        date: "2019",
        what: "Collar renewed after a dog.",
        charge: 0,
        basis: "Not a fault in the coat and not a fault in the dog.",
      },
    ],
  },
];

export type Fault = {
  clip: number;
  lot: string;
  headline: string;
  detail: string;
  /** How many coats were affected, and what was done. */
  outcome: string;
};

/**
 * Published because a mill with no recorded faults is a mill that does not
 * inspect, and because this is the only part of a traceability claim that
 * cannot be imitated by a competitor's copywriter.
 */
export const FAULTS: Fault[] = [
  {
    clip: 2018,
    lot: "AW/2018/CMD",
    headline: "Shade band across 40 m of Camas Dubh cloth",
    detail:
      "A weft bobbin from a different spinning ran into the middle of piece 3. The band is about 40 mm wide and reads as a faint line, and it fell in the left front of twelve coats. It passed inspection because it is invisible under the mender's glass and obvious in daylight, which is a lesson we have kept.",
    outcome:
      "All twelve owners were written to and offered a full refund or a remake from the following clip. Five took the refund. Four asked to keep the coat and were refunded £200. Three said they could not see it.",
  },
  {
    clip: 2020,
    lot: "All lots",
    headline: "The 2020 clip is a year late and labelled accordingly",
    detail:
      "The mill shut for eleven weeks in 2020. The clip was sheared on time, sat in the shed until August, scoured in October and finished in February 2021. Wool does not spoil in a dry shed, and nothing about the cloth is worse for it.",
    outcome:
      "Coats from the 2020 clip carry a 2020 lot code and a 2021 dispatch date. If you own one and the two dates puzzled you, this is why.",
  },
  {
    clip: 2021,
    lot: "AW/2021/CNF",
    headline: "Under-milled cloth: fourteen coats' cuffs wore through in two years",
    detail:
      "We cut the milling at Selkirk from fifty-five minutes to forty because buyers said the 2020 cloth was harsh. Forty minutes does not close the weave enough for a cuff. The cloth was soft, everyone liked it, and it failed.",
    outcome:
      "Fourteen coats. All fourteen cuffs and front edges rebound in older, harder cloth at our cost, carriage both ways, on our initiative rather than on complaint. Milling is back to fifty-five minutes and will stay there. The 2021 cloth is otherwise sound and those fourteen coats are all still in service.",
  },
  {
    clip: 2023,
    lot: "AW/2023/ARH",
    headline: "Horn buttons from a new supplier cracked in frost",
    detail:
      "Forty-one coats went out with buttons from a second supplier taken on when our own ran short. Nine owners reported cracking in the first cold spell; the horn had been over-dried in polishing.",
    outcome:
      "All forty-one coats' buttons replaced free, including the thirty-two nobody had complained about. We went back to one supplier and now buy a year ahead.",
  },
  {
    clip: 2025,
    lot: "AW/2025/TBG",
    headline: "Moorit sorted too loosely; sleeves did not match bodies",
    detail:
      "Torr Beag fleece is hand-sorted into three shades and blended. In 2025 the sort was rushed and the blend drifted between the start and the end of the warp, so on six coats the sleeves are visibly lighter than the body.",
    outcome:
      "Six coats remade from the 2026 clip at no charge and the owners kept the originals. The sorting is now done by one person over five days rather than two people over two.",
  },
];
