"use client";

import Link from "next/link";

import s from "./arch.module.css";
import { ChainFig, HingeFig, InvertFig, LintelFig, RiseFig, ThrustFig } from "./figures";

function Ref({ n }: { n: number }) {
  return (
    <a className={s.ref} href={`#note-${n}`} aria-label={`Note ${n}`}>
      {n}
    </a>
  );
}

export default function Chapter() {
  return (
    <div className={s.root}>
      <a className={s.skip} href="#chapter">
        Skip to the chapter
      </a>
      <Link className={s.task} href="/tasks/educational-interactive-textbook">
        The task
      </Link>

      <header className={s.masthead}>
        <p className={s.kicker}>
          <span>Chapter</span>
          <span>Statics of masonry</span>
          <span>A reading</span>
        </p>
        <h1 className={s.title}>Arch</h1>
        <p className={s.deck}>
          A pile of stones that will not hold together in a straight line will
          hold a cathedral up, if you let the shape do the work.
        </p>
        <p className={s.byline}>
          <span>Twenty minutes, if you move the figures</span>
          <span>Drag, or the sliders</span>
          <span>Modelled plane statics, not a measured building</span>
        </p>
        <ol className={s.contents}>
          <li>
            <a href="#tension">
              <span>I</span>A stone does not want to be a beam
            </a>
          </li>
          <li>
            <a href="#shape">
              <span>II</span>The shape is where the force goes
            </a>
          </li>
          <li>
            <a href="#chain">
              <span>III</span>A hanging chain
            </a>
          </li>
          <li>
            <a href="#thrust">
              <span>IV</span>The line of thrust
            </a>
          </li>
          <li>
            <a href="#hinges">
              <span>V</span>Hinges, not crushing
            </a>
          </li>
          <li>
            <a href="#invert">
              <span>VI</span>The whole argument, hanging
            </a>
          </li>
        </ol>
      </header>

      <article id="chapter">
        <section className={s.section} id="tension">
          <div className={s.sectionHead}>
            <span className={s.secNum}>I — Tension</span>
            <h2 className={s.h2}>A stone does not want to be a beam</h2>
          </div>
          <div className={s.col}>
            <p className={`${s.p} ${s.first}`}>
              An arch is a structure that cannot work in tension, made of pieces
              that are not attached to each other, and it stands for a thousand
              years. Stated like that, the fact is genuinely surprising. The
              rest of this chapter is the reason, and the reason is a shape.
            </p>
            <p className={s.p}>
              Put a plank across a gap and stand in the middle. The top of the
              plank shortens; the bottom lengthens. The top is in compression,
              the bottom in tension. Wood does not mind. Steel does not mind.
              Stone minds a great deal. Its compressive strength is large; its
              tensile strength is a small fraction of that, often treated as
              nothing at all. A stone lintel over a wide door is a nervous
              thing. It is asking the bottom of the stone to do the one thing
              stone cannot be relied on to do.
            </p>
            <p className={s.p}>
              So you stop asking. You cut the opening into wedges — voussoirs —
              and stack them so that every piece is being squeezed, never bent.
              The gap is the same. The material is the same. The forces have
              been rearranged by geometry. That is the whole invention.
            </p>
          </div>

          <LintelFig />

          <div className={s.col}>
            <p className={s.p}>
              Drag the load, or widen the opening. In the lintel the midspan
              moment grows with the span; the bottom of the beam has to stretch
              more. In the arch the stones remain in compression. What grows
              instead is the horizontal push at the feet. You have not abolished
              the problem of the opening. You have sent it sideways, to whoever
              is holding the ends.
            </p>
          </div>
        </section>

        <section className={s.section} id="shape">
          <div className={s.sectionHead}>
            <span className={s.secNum}>II — Shape</span>
            <h2 className={s.h2}>The shape is where the force goes</h2>
          </div>
          <div className={s.col}>
            <p className={s.p}>
              Once only compression is allowed, the force must travel on a path
              that never tries to pull. That path is not a decoration on the
              drawing. It is the structure. Change the shape and you change
              where the force goes, and how hard it pushes on the way.
            </p>
            <p className={s.p}>
              A high arch and a flat arch, same span, same stones, do not do
              the same work. The flat one pushes sideways much harder. For a
              load that is uniform across the opening — a deck, a wall sitting
              on a row of arches — the horizontal thrust is the total weight
              times the span, divided by eight times the rise.
            </p>
            <p className={s.pull}>
              H&nbsp;=&nbsp;W&thinsp;L&nbsp;/&nbsp;8r. Halve the rise, double
              the push.
            </p>
            <p className={s.p}>
              Self-weight of the ring itself is not quite that load. A circular
              arch is heavier, per unit of span, near the springings, because
              more stone sits in a given horizontal interval where the curve is
              steep. The figure computes that case properly, and also draws the
              parabola of the deck-load formula, so you can see they are
              cousins and not twins. What they agree on is the dependence on
              rise. A very flat arch is a fierce neighbour. A pointed arch —
              two steep sides meeting at a crown — is a quieter one: more of
              the force is already pointing at the ground.
            </p>
          </div>

          <RiseFig />

          <div className={s.col}>
            <p className={s.p}>
              The red arrows are what the abutments are for. Rock will do.
              A thick wall will do. The next arch in an arcade will do, until
              someone takes it down. A hidden tie in the floor will do. A
              flying buttress is a way of catching that horizontal force up in
              the air and walking it down to the ground at a slope the masonry
              can bear. If nothing answers the push, the feet walk apart, and
              the chapter ends at the hinges.
            </p>
          </div>
        </section>

        <section className={s.section} id="chain">
          <div className={s.sectionHead}>
            <span className={s.secNum}>III — The catenary</span>
            <h2 className={s.h2}>A hanging chain</h2>
          </div>
          <div className={s.col}>
            <p className={s.p}>
              Hang a chain from two nails. It finds a curve. Not a circle, not
              a guess: the unique curve in which every link is being pulled
              purely along the chain, never bent. That curve is a catenary. The
              word means “pertaining to a chain.” The equation is
              y&nbsp;=&nbsp;a&nbsp;cosh(x/a), and a is the horizontal tension
              divided by the weight of a unit length. You do not need the
              equation to use the chain. The chain is the equation.
            </p>
            <p className={s.p}>
              A parabola is what you get if the load is uniform across the
              horizontal — a suspension-bridge deck, or the formula of the last
              section. A chain is loaded along itself. They look similar from
              across the room. They are not the same, and the figure will not
              let them pretend.
            </p>
          </div>

          <ChainFig />

          <div className={s.col}>
            <p className={s.p}>
              Invert the drawing. Every pull becomes a push. The curve that was
              in pure tension is now in pure compression. That is the arch
              which carries the same weights without ever asking a stone to
              stretch. It is one of the loveliest facts in engineering, and it
              is exact: not a metaphor, a correspondence of statics.
            </p>
            <div className={s.aside}>
              <p>
                Robert Hooke knew this in 1675 and published it as an anagram,
                which is a very Hooke thing to have done. Two years later he
                unscrambled it:{" "}
                <span className={s.latin}>
                  ut pendet continuum flexile, sic stabit contiguum rigidum
                  inversum
                </span>
                . As hangs the flexible line, so but inverted will stand the
                rigid arch.
                <Ref n={1} />
              </p>
            </div>
          </div>
        </section>

        <section className={s.section} id="thrust">
          <div className={s.sectionHead}>
            <span className={s.secNum}>IV — The thrust line</span>
            <h2 className={s.h2}>A path that must stay in the stone</h2>
          </div>
          <div className={s.col}>
            <p className={s.p}>
              A real arch is not a mathematical curve of zero thickness. It is
              a band of masonry with an inside face — the intrados, the soffit
              you look up at — and an outside face, the extrados. The force
              does not have to follow the centreline. It has to stay inside the
              band.
            </p>
            <p className={s.p}>
              The path it takes is called the thrust line. It is the funicular
              of whatever loads the arch is actually carrying: self-weight,
              fill, a cart at one point on the extrados. In a plane structure
              with only vertical loads the horizontal force H is constant along
              the line, and the rise of the line above the chord between its
              ends is the bending moment of those loads, treated as a
              simply-supported beam, divided by H. That is not a slogan. It is
              how the red curve in the figure is drawn.
            </p>
            <p className={s.p}>
              Because the stones are not attached, the thrust line is also a
              verdict. If you can draw one from abutment to abutment that never
              leaves the masonry, the arch can stand. You do not have to find
              the “real” forces, which are in any case indeterminate. You have
              to find one possible set that works. That is Jacques Heyman’s
              safe theorem, and it is the most useful sentence in the
              subject.
              <Ref n={2} />
            </p>
            <p className={s.p}>
              If the line drifts into the outer third of a rectangular joint,
              part of the joint goes into tension and opens. The middle third
              is the kern: stay inside it and the whole joint is in
              compression. If the line reaches a face, a hinge has formed —
              the joint can rotate, touching at a point. If the line leaves the
              stone, that arrangement is impossible.
            </p>
          </div>

          <ThrustFig />

          <div className={s.col}>
            <p className={s.p}>
              A semicircle is a convenient shape to draw and a slightly awkward
              shape to stand up. The funicular of self-weight is flatter at the
              crown than a circle is, and steeper at the sides. A thin
              semicircular arch cannot contain that curve. This is why
              semicircular arches are thick, and why the minimum thickness of a
              semicircular arch is a problem with a history — Couplet, Coulomb,
              Heyman — and an answer of about a tenth of the radius.
              <Ref n={3} />
              Thin the arch in the figure until no red line will sit in the
              stone. That is the geometric fact, under your hand.
            </p>
            <p className={s.p}>
              A catenary arch of uniform thickness does not have this problem.
              Its centreline <em>is</em> the funicular of its own weight. The
              thrust line and the shape coincide, and the ring can be as thin
              as the mason dares for other reasons. That is what “the catenary
              is special” actually means. Not prettier. Coincident.
            </p>
          </div>
        </section>

        <section className={s.section} id="hinges">
          <div className={s.sectionHead}>
            <span className={s.secNum}>V — Failure</span>
            <h2 className={s.h2}>Hinges, not crushing</h2>
          </div>
          <div className={s.col}>
            <p className={s.p}>
              Stone is, for the loads in a historic arch, almost absurdly
              strong in compression. The stones of a cathedral do not crush.
              What they do is open. Heyman’s other two assumptions sit next to
              this one: masonry has no tensile strength worth counting, and
              joints do not slide. Together they say that an arch is a
              collection of rigid pieces that may separate, and that failure is
              a matter of geometry and mechanism, not of material strength.
            </p>
            <p className={s.p}>
              A hinge in masonry is not a pin you installed. It is a joint that
              has opened at one face and is touching at the other. Three such
              hinges and the arch is still a structure — statically
              determinate, able to stand, the thrust line now forced through
              those three points. Four hinges and it is a mechanism. It can
              move. It will.
            </p>
            <p className={s.p}>
              The usual death of a semicircular arch whose abutments have
              spread is four hinges: one at each springing on the intrados, and
              one at each haunch on the extrados. The crown drops. The haunches
              kick out. You can watch it happen in the figure, slowly, which is
              a courtesy the building will not extend.
            </p>
          </div>

          <HingeFig />

          <div className={s.col}>
            <p className={s.p}>
              The travelling load is there so you can see the same thing from
              the other end. An unsymmetric cart pulls the safest thrust line
              toward one face and then through it. The figure searches for the
              kindest H and the kindest springing points it can find; when even
              those will not keep the line in the stone, no line exists, and
              the arch cannot carry that cart. Being able to move the cart is
              the point. A paragraph cannot quite do what a joint opening
              under a load can do.
            </p>
          </div>
        </section>

        <section className={s.section} id="invert">
          <div className={s.sectionHead}>
            <span className={s.secNum}>VI — Inversion</span>
            <h2 className={s.h2}>The whole argument, hanging</h2>
          </div>
          <div className={s.col}>
            <p className={s.p}>
              So hang a chain. Give it the same span and the same loads. Invert
              it. If the inverted chain lies inside the masonry, you have found
              a thrust line, and the arch can stand. If you cannot find a
              hanging that fits, no thrust line exists, and the arch cannot.
            </p>
            <p className={s.p}>
              A uniform chain of equal links finds the catenary, and its
              inversion is the right arch for weight arranged along that curve.
              If you instead hang little weights from the chain to match the
              stones of a particular arch — Gaudí’s method, and the older
              method of the funicular polygon — the hanging shape is the thrust
              line of <em>that</em> arch.
              <Ref n={4} />
              The last figure does the second thing. The chain below is the
              funicular of these voussoirs; the red line above is the same
              construction, inverted. They are one object.
            </p>
          </div>

          <InvertFig />

          <div className={s.col}>
            <p className={s.p}>
              Switch the masonry to a catenary and thin it. The chain still
              nests. Switch it back to a semicircle and thin it, and you will
              run out of hangings that fit. That is the chapter, in one
              gesture. A stone that cannot take tension; a shape that never
              asks it to; a line of thrust that must stay in the ring; an
              outward push that someone must hold; a failure that is four
              hinges and not a crushed block; and a chain, hanging from two
              points, that quietly solves the whole problem.
            </p>
          </div>
        </section>
      </article>

      <footer className={s.notes}>
        <h2>Notes</h2>
        <ol>
          <li id="note-1">
            Robert Hooke, <em>A Description of Helioscopes, and some other
            Instruments</em>, London, 1676. The anagram was published in 1675;
            the Latin sentence appears in the 1676 tract. The correspondence is
            exact for a flexible line and its inverted rigid partner under the
            same loads.
          </li>
          <li id="note-2">
            Jacques Heyman, <em>The Stone Skeleton: Structural Engineering of
            Masonry Architecture</em>, Cambridge University Press, 1995; and{" "}
            <em>The Masonry Arch</em>, Ellis Horwood, 1982. The safe theorem
            belongs to plastic limit analysis: if any equilibrium state lies
            within the yield surface — here, any thrust line inside the
            masonry — the loads are not above collapse.
          </li>
          <li id="note-3">
            Pierre Couplet, “De la poussée des voûtes,”{" "}
            <em>Histoire de l’Académie Royale des Sciences</em>, 1729/1731.
            Heyman’s modern value for the minimum thickness of a semicircular
            arch of uniform density is t/R&nbsp;≈&nbsp;0.106. The figure uses
            a discrete voussoir self-weight and a search over H, so the
            thickness at which the line first refuses to fit will sit near
            that number, not exactly on it.
          </li>
          <li id="note-4">
            Antoni Gaudí’s hanging models for Colònia Güell and the studies
            toward the Sagrada Família. Weighted strings, inverted by a
            photograph or a mirror, are funicular polygons of the intended
            loads. The last figure is that construction, not a uniform
            catenary laid over a circle and hoped to fit.
          </li>
        </ol>
        <p style={{ marginTop: "1.4rem" }}>
          The figures are plane models. They omit fill and spandrels, sliding,
          finite compressive strength, out-of-plane effects, and the yielding
          of real abutments as a soil problem. Where a number is computed, it
          is computed from the model just described. Nothing here is a
          measurement of a particular building.
        </p>
      </footer>

      <p className={s.colophon}>
        <span>Arch · a chapter</span>
        <Link href="/tasks/educational-interactive-textbook">The task</Link>
      </p>
    </div>
  );
}
