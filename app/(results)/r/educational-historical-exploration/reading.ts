import type { CauseId, EvidenceId } from "./data";

type Input = {
  cause: CauseId;
  opened: Set<string>;
  used: Set<EvidenceId>;
};

function has(input: Input, id: EvidenceId): boolean {
  return input.opened.has(id) || input.used.has(id);
}

/**
 * A reading of the learner's account. Not a score. It says what the claim
 * explains, what it leaves standing, and which papers would press it.
 */
export function reading(input: Input): { title: string; body: string } {
  const workhouse = has(input, "workhouse");
  const brewery = has(input, "brewery");
  const hampstead = has(input, "hampstead");
  const handle = has(input, "handle");
  const whitehead = has(input, "whitehead");
  const anomalies = [workhouse, brewery, hampstead].filter(Boolean).length;

  if (input.cause === "unknown") {
    return {
      title: "That is available, and it is not empty",
      body:
        "The cluster is real. So is the smell. So is a falling curve. None of those, alone, names a cause. If you have not yet opened the workhouse, the brewery, or the Hampstead death, you are in the position Snow was in before he asked the next question — and that is a better place than a confident story.\n\nThe next move is not a theory. It is a return. The workhouse sits in the middle of the dead streets. The brewery sits on Broad Street itself. A woman died three miles away. Each of those looks like it might ruin a local explanation. That is why they are worth asking for.",
    };
  }

  if (input.cause === "miasma") {
    const parts: string[] = [
      "The map does not forbid you. A disease of bad air predicts exactly this shape: the lowest, closest, most stinking streets, a flight, a parish emptying from the middle. Farr’s elevation law is a real regularity. The Board of Health was not being stupid.",
    ];
    if (!workhouse && !brewery && !hampstead) {
      parts.push(
        "You have not yet faced the three facts that make this view expensive. The workhouse is in the middle of the outburst and almost empty of deaths. The brewery is on Broad Street and lost no men. A woman who had not been in Soho for months died in Hampstead after drinking a bottle of this water. Each of those is where miasma has to start inventing special air.",
      );
    } else {
      if (workhouse) {
        parts.push(
          "You have the workhouse return. Five deaths among 535 inmates, in a house more than three-fourths surrounded by the dead. The inmates never sent to Broad Street; they had their own well and the Grand Junction. Air does not stop at a wall that water does.",
        );
      }
      if (brewery) {
        parts.push(
          "You have Huggins. Seventy men on Broad Street, none dead of cholera, a deep well, and beer. Behind them, seven of thirty-five lodging-house labourers who used the street pump. Same air. Different drink.",
        );
      }
      if (hampstead) {
        parts.push(
          "You have Mrs E——. No cholera at West End. No visit to Broad Street. A bottle, preferred for its taste, and two deaths. A miasma that travels in a cart and spares the parish it leaves is no longer a miasma.",
        );
      }
    }
    if (has(input, "elevation")) {
      parts.push(
        "The elevation wash is schematic, and it agrees with you: the cluster sits in the hollow. That is also what a contaminated well in a low parish would look like. Elevation does not decide between the two.",
      );
    }
    return {
      title: "A respectable account — until the empty houses",
      body: parts.join("\n\n"),
    };
  }

  if (input.cause === "broad") {
    const parts: string[] = [
      "This is Snow’s claim. The first argument for it is the cluster itself, and the 83 houses he walked: 61 of 73 in the pump’s locality had drunk the water. That is already more than a shape on a map.",
    ];
    if (anomalies === 0) {
      parts.push(
        "You have the cluster and not yet the anomalies. The cluster is what miasma also predicts. The workhouse, the brewery, and the Hampstead bottle are the part that looks like a refutation and is the confirmation: people in the poisoned air who did not drink were spared; people far from the air who did drink were not.",
      );
    } else {
      parts.push(
        "The anomalies you opened are doing the real work. An empty building in a dead street is not a hole in a water theory. It is a building that did not use the well. A death in Hampstead is not an exception. It is the well, bottled.",
      );
    }
    if (handle) {
      parts.push(
        "You have Snow’s own caveat. The fatal attacks were already falling on the morning the handle came off. The streets were emptying. He wrote that the water may already have ceased to contain the poison. If your account is “the handle stopped the outbreak,” the table contradicts you. If it is “the pump was the source,” the table is silent on the last inch of proof and loud on everything before it.",
      );
    } else {
      parts.push(
        "Look at the table before you credit the handle. The outburst is in decline by the 8th of September. Snow said so. The legend does not.",
      );
    }
    if (whitehead) {
      parts.push(
        "You have Whitehead’s 1855 finding: the infant at no. 40, the cesspool, the leak into the well. That is the seed, and it arrived a season late. It is all right to have reached the pump without it. It is not all right to pretend September had it.",
      );
    }
    return {
      title: "The pump — and what still fails to follow",
      body: parts.join("\n\n"),
    };
  }

  if (input.cause === "pumps") {
    return {
      title: "Too wide, and the other wells show it",
      body:
        "Several wells were dirty. Snow found flocculent particles in Broad Street, Warwick Street, and Bridle Lane. That is not the same as several wells causing this outburst.\n\nThe deaths thin out, he wrote, at the walking-distance line between Broad Street and the next pump — with one telling exception. The Marlborough Street well was so bad that people who lived beside it sent to Broad Street, and they died. Vigo Street, which looked clean, did not produce a second cluster.\n\nIf all street pumps were the cause, the workhouse’s own pump and the brewery well become puzzles of a different kind. They are not. Those people were not using Broad Street.",
    };
  }

  if (input.cause === "sewer") {
    const parts: string[] = [
      "A sewer under Broad Street is a local cause, and the cluster will tolerate it. It does not tolerate the bottle in Hampstead, or the brewery men who worked over the same ground and drank something else.",
    ];
    if (hampstead) {
      parts.push(
        "Mrs E—— never walked the sewer. The cart did not carry air from a drain. It carried a bottle.",
      );
    } else {
      parts.push(
        "Open the Hampstead death before you rest here. A sewer does not travel three miles in a cart.",
      );
    }
    if (workhouse || brewery) {
      parts.push(
        "The workhouse and the brewery sit on the same ground. Their exemption is a water exemption, not a drain exemption.",
      );
    }
    parts.push(
      "Whitehead later found a cesspool leaking into the well at no. 40. That is sewage, and it is also specific: not the street drain as a miasma, but one leak into one drinking place. The distinction is the whole argument.",
    );
    return {
      title: "Close — and then the water has to be the sewer’s route",
      body: parts.join("\n\n"),
    };
  }

  if (input.cause === "contagion") {
    return {
      title: "Households, yes — but not only the near",
      body:
        "Cholera does move through houses. Laundry, hands, a shared cup. That is not in dispute, and Snow did not claim every case came from the well.\n\nWhat contagion-as-proximity cannot do is the Hampstead bottle, the Brighton visitor who stayed twenty minutes and never saw the body, or the coffee-shop customers who shared a drink and not a sickroom. It also predicts the workhouse badly. Five hundred and thirty-five of the most crowded people in the parish, receiving the dying, and five inmate deaths.\n\nIf you keep a contagious poison and put it in the water, you have Snow. If you keep it only in the air between bodies, the empty buildings and the distant deaths are still sitting there.",
    };
  }

  return {
    title: "Filth is the ground. It is not the mechanism.",
    body:
      "Soho was filthy. The cesspools were old. The parish was overcrowded. None of that is decorative, and a piece that ignored it would be lying.\n\nFilth without a route does not explain a brewery of seventy men on the worst street, a workhouse of 535 in the middle, and a widow in Hampstead. Those three are the same kind of fact: exposure to one water, or not.\n\nThe temptation of “general filth” is that it cannot be wrong. That is also why it cannot tell the Guardians which handle to take off.",
  };
}
