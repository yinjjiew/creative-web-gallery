import type { InterviewDoc } from "./types";

/**
 * Composite interview. The job, the layout and the constraints are those
 * of a large UK container port. The speaker is written from published
 * accounts and typical harbourmaster practice, not from a named officer.
 */
export const harbour: InterviewDoc = {
  subject: "A harbourmaster, speaking on condition of not being named",
  setting:
    "A large container port on the North Sea coast. The office has a window onto the quay and a window onto a screen. The screen is the more useful of the two. Dialogue reconstructed; the arrangement of the port is not.",
  turns: [
    {
      q: "If I only look at the aerial photograph, what am I getting wrong?",
      a: [
        "You’re getting the pretty version, which is the least true. The photograph shows boxes and cranes and a nice bit of water. It does not show time. A port is a timetable that happens to have concrete underneath it. The berth that looks empty is not empty. It is waiting for a ship that has a tide, a pilot, a tug allocation and a stack of boxes that have to be in a certain order or the next ship is late. The yard that looks full is not a warehouse. It is a puzzle that is being solved at about two hundred moves an hour.",
        "The photograph also lies about the edge. People think the water is the port. The water is the arrival. The port is the landside: the gate, the rail spur, the lorry park, the inspection shed, the place where a box sits for sixteen hours because a document is wrong. If the landside is slow the water looks calm and everybody writes a story about how efficient we are. We are not efficient. We are just hiding the delay in a stack.",
      ],
    },
    {
      q: "Why is it arranged the way it is? It does not look like anyone designed it.",
      a: [
        "Someone did. Then someone else designed the next bit beside it, because you cannot close a port to make it elegant. The oldest quay is where the river allowed a draught in 1967. The newest quay is where the river allowed a bigger draught after a dredge that took years and a consent that took longer. Between them is a yard that was the right depth of tarmac for a smaller box and is now a compromise. We put the rail on the landward side because that is where the main line already was. We put the reefer plugs where the substation could reach. We put the empty stacks where the wind would not throw them, and then the wind changed its habits and we moved the empties again.",
        "If you built it on a clean field tomorrow you would still get something that looks accidental in five years, because the ships keep changing length and the boxes keep changing who owns them. Design in a port is the art of not painting yourself into a corner you will need next Tuesday.",
      ],
    },
    {
      q: "What does a harbourmaster actually decide?",
      a: [
        "Whether a ship comes in, when, and under what restrictions. Draught, wind, visibility, a defect on the vessel, a defect on a tug, a pilot who has already done his hours. I do not decide what is in the boxes. I decide whether the thing carrying the boxes is allowed to move in my water. That sounds like a veto. Most days it is a conversation that ends with a yes and a set of conditions: slow in the approach, two tugs not one, berth three not four because four has a crane down.",
        "The decision people imagine is the dramatic no. The decision I actually lose sleep over is the yes that was slightly too early. A ship that comes off a berth in a wind she should have waited out. Nobody thanks you for the wait. Everybody remembers the contact.",
      ],
    },
    {
      q: "The box — you said the box is the job.",
      a: [
        "The ship is a visitor. The box is the resident. Twenty or forty feet of steel, a number, a seal, a weight that may or may not be the weight on the document, and a destination that is a postcode and a time that has already slipped. The quay crane is fast. The yard crane is fast. The thing that is not fast is the moment when a box is not where the system thinks it is, or is where the system thinks it is and the lorry is not.",
        "We measure the port in box moves and in dwell. Dwell is how long a box sits. Sitting looks like storage. Sitting is failure to decide. A box that sits is occupying a slot that the next ship needs, and the next ship is already on the approach. So yes: the box is the job. The water is just how the box gets here.",
      ],
    },
    {
      q: "What do visitors always ask that is the wrong question?",
      a: [
        "They ask how many ships a day. Ships are the wrong unit. Ask how many boxes, and then ask how many of those boxes go out by rail rather than by road, and then ask what happens when the rail has a possession on a Wednesday. They ask about automation as if it were a moral improvement. Automation is a way of being fast at the thing you have already decided. It will not decide the document. It will not dredge the approach. It will not make a pilot less tired.",
        "They also ask whether we are worried about being replaced by another port. Of course. That is a tide too. What they do not ask is whether the town can take the lorries the other port does not want. A container port is a machine for turning a ship into a road problem. If you do not want the road problem you do not want the port, and you should say so before you ask for the jobs.",
      ],
    },
    {
      q: "Is there anything on the quay that is still, in the sense of this issue — still running, still not replaced?",
      a: [
        "The leading lights. People think navigation is all screens. The lights are still there, still aligned on a bearing, still the thing a pilot will mention if they are out. And the tide boards, which are vulgar painted numbers on a wall and more trusted, in a certain kind of moment, than a digital gauge that had a software update on Monday.",
        "Also the rule that you do not argue with a lock when the lock-keeper says no. We do not have a lock here in the canal sense, but we have the equivalent: a window. The window is physics. You can put a new terminal operating system on top of physics. You cannot put it underneath.",
      ],
    },
  ],
};
