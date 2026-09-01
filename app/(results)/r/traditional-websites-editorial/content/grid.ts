import type { DiagramDoc } from "./types";

export const sixty: DiagramDoc = {
  figure: "grid",
  lede: "The public frequency record of Wednesday 27 August 2025, 12:00–13:00 BST, annotated. Nominal 50 hertz. The country was ordinary. That is what makes the hour worth drawing.",
  notes: [
    {
      n: 1,
      text: "Great Britain’s statutory frequency limits are 49.5–50.5 Hz. NESO publishes historic frequency at one-second resolution. The Wednesday chosen is ordinary; the annotations describe typical signatures, not a claimed reconstruction of every control-room action that hour.",
    },
  ],
  blocks: [
    {
      t: "p",
      text: "A national electricity system is a promise that the next second will look like this one. The promise is kept by holding the frequency of the alternating current close to fifty hertz — fifty cycles a second — which is another way of saying that generation and demand are being matched faster than a person can think about them. When they are not matched, the frequency moves. When the frequency moves far enough, things start to disconnect themselves, and the promise becomes a different kind of news.{{1}}",
    },
    {
      t: "p",
      text: "The diagram is one hour of that matching, taken from the public frequency data NESO publishes, for a Wednesday that had no named incident. I have marked the events that are visible in the trace if you know what you are looking at, and I have left unmarked the ones that are not. A diagram that pretended to show every trade, every response, every boiler that switched off would be a lie about how the system is seen from outside.",
    },
    {
      t: "h3",
      text: "1 · The band",
    },
    {
      t: "p",
      text: "The operational band most of the time is much tighter than the statutory one. Statute says the system should stay between 49.5 and 50.5 Hz. In practice the control room treats a wander toward 49.8 or 50.2 as a thing to be answered, not admired. The shaded band on the drawing is that working corridor, not the legal cliff. The legal cliff is why the working corridor exists.",
    },
    {
      t: "h3",
      text: "2 · The lunch step",
    },
    {
      t: "p",
      text: "At about 12:04 the frequency dips a fraction and then recovers. This is not a fault. It is a country putting the kettle on, or the industrial equivalent: a rise in demand that was forecast, and a response that was waiting. The forecast is a model of habit. The response is a stack of plant and batteries contracted to move when they are told. The dip is the gap between the model and the kettles. On an ordinary Wednesday the gap is small. On a final of a football tournament it is a known joke with a real megawatt number behind it.",
    },
    {
      t: "h3",
      text: "3 · Inertia",
    },
    {
      t: "p",
      text: "The slope of a dip is as important as its depth. A system with a lot of spinning steel — big turbines, synchronised — changes frequency slowly when something trips. A system with a lot of inverters and not much steel changes it quickly. The hour I have drawn is not a low-inertia hour; it is a summer midday with a decent amount of solar and enough conventional plant still running that the slopes are polite. The control room watches the slope anyway, because politeness is not a contract.",
    },
    {
      t: "h3",
      text: "4 · Response",
    },
    {
      t: "p",
      text: "When frequency leaves the middle of the band, contracted services move. Some of them move in under a second — batteries, some demand response. Some of them move in tens of seconds. The old names, primary and secondary, have been replaced by a thicker vocabulary of response products; the physics is the same. Something has to inject or absorb power until a slower thing — a plant turning up, a interconnectors’s schedule, a reduction in demand — takes over. The wiggle at 12:31 is that handoff, visible as a recovery that overshoots a little and then settles.",
    },
    {
      t: "h3",
      text: "5 · The interconnectors",
    },
    {
      t: "p",
      text: "The island is not an island electrically. Cables to France, Belgium, the Netherlands, Norway, Denmark and Ireland carry schedules that were agreed in advance and deviations that were not. A change on the far end of a cable is a change here. At 12:44 the trace shows a small, square-looking lift that is consistent with a scheduled interconnector step, not with a trip. I have marked it as that, and noted that a public frequency trace cannot prove a schedule on its own. The shape is the evidence there is.",
    },
    {
      t: "h3",
      text: "6 · What is not on the drawing",
    },
    {
      t: "p",
      text: "Voltage. Thermal limits on individual lines. The fact that a wind farm in Scotland and a city in the Midlands are not interchangeable just because they share a frequency. Constraint payments. The phone call that did not happen. A frequency diagram is a picture of balance, not of the network. It is the country’s pulse, not its skeleton. People who only watch the pulse miss the skeleton; people who only draw the skeleton forget that the pulse is the thing that fails first in public.",
    },
    {
      t: "p",
      text: "At 13:00 the hour ended as it had begun, inside the band, with no press release. The system had bought and sold its way through sixty minutes of ordinary life. That is the product. The annotated trace is just the receipt.",
    },
  ],
};
