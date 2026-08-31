import type { Metadata } from "next";
import Link from "next/link";

import { fontClass } from "./fonts";
import s from "./weighbridge.module.css";

/**
 * Weighbridge — a restaurant whose site exists to prevent misunderstandings.
 *
 * The reading page is a server component because it is a document: no state, no
 * effects, nothing to hydrate. The booking flow, which genuinely needs a client,
 * lives in ./book.
 *
 * The structural idea is the weighbridge ticket. A weighbridge declares weights
 * in a column of figures against a printed line; this page declares its terms
 * the same way. Every difficult fact — the price, the sitting time, the number
 * of choices, the cancellation window — is a figure to the left of a single
 * vertical rule, with the explanation to its right. That is what keeps the terms
 * from reading as a list of prohibitions: they are measurements, not rules, and
 * they are at full size near the top rather than in grey at the bottom.
 */
export const metadata: Metadata = {
  title: "Weighbridge, Fen Road, Marchbourne",
  description:
    "Eighteen seats, one sitting a night, five nights a week. Nine or ten courses decided that morning, £95 a head. What you are agreeing to, in full, before you book.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // The results layout pins maximumScale at 1 for canvas-based work. This is a
  // page of text; pinch zoom must work.
  maximumScale: 5,
  userScalable: true,
};

const FIGURES: [string, string][] = [
  ["Seats", "18"],
  ["Sittings a night", "1"],
  ["Nights a week", "5"],
  ["Doors open", "19:15"],
  ["Room sits", "19:30"],
  ["Dinner ends", "≈ 22:30"],
  ["Courses", "9–10"],
  ["Choices", "0"],
  ["A head", "£95"],
  ["Service", "included"],
];

const CONTENTS: [string, string][] = [
  ["#figures", "In figures"],
  ["#what", "What this is"],
  ["#terms", "What you are agreeing to"],
  ["#wednesday", "A Wednesday in August"],
  ["#wine", "Wine"],
  ["#bookings", "Bookings"],
  ["#there", "Getting there"],
  ["#access", "Access"],
];

const COURSES = [
  "Oyster, gooseberry",
  "Bread, and butter churned on Tuesday",
  "Broad beans, curd, mint",
  "Grilled leeks, hazelnut, a hard ewe’s cheese",
  "Brown shrimp, cucumber, dill",
  "Turbot on the bone, mussels, sea beet",
  "Hogget, its own broth, turnip tops",
  "Chicory, walnut oil",
  "Blackcurrant leaf, sheep’s milk",
  "Damson, oat",
];

function Section({
  number,
  id,
  title,
  children,
}: {
  number: string;
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <hr className={s.sectionRule} />
      <p className={s.sectionNumber} aria-hidden="true">
        {number}
      </p>
      <h2 className={s.sectionTitle} id={id}>
        {title}
      </h2>
      {children}
    </>
  );
}

/** A term: its governing figure to the left of the rule, its plain English right. */
function Term({
  figure,
  heading,
  children,
}: {
  figure: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <p className={s.termFigure}>{figure}</p>
      <div className={s.termBody}>
        <h3 className={s.termHeading}>{heading}</h3>
        {children}
      </div>
    </>
  );
}

export default function Weighbridge() {
  return (
    <div className={`${fontClass} ${s.root}`}>
      <a className={s.skip} href="#main">
        Skip to the page
      </a>

      <div className={`${s.page} ${s.ruled}`}>
        <header className={s.masthead}>
          <p className={s.where}>
            Fen Road
            <br />
            Marchbourne
          </p>
          <h1 className={s.wordmark}>Weighbridge</h1>
          <p className={s.standfirst}>
            Eighteen seats in the old weighbridge at the edge of town. One
            sitting a night, Wednesday to Sunday. Nine or ten courses, decided
            that morning from whatever arrived, at ninety-five pounds a head.
            Dinner takes three hours.
          </p>
          <div className={s.scale} aria-hidden="true" />
          <nav className={s.contents} aria-label="Contents">
            <ul>
              {CONTENTS.map(([href, label]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
              <li>
                <Link href="/r/traditional-websites-restaurant/book">
                  Book a seat
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        <main className={s.beam} id="main">
          <Section number="01" id="figures" title="In figures">
            <dl className={s.ticket}>
              {FIGURES.map(([term, value]) => (
                <div className={s.ticketRow} key={term}>
                  <dt>{term}</dt>
                  <dd>
                    <span>{value}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className={s.footnote}>
              The nought is the figure people miss.
            </p>
          </Section>

          <Section number="02" id="what" title="What this is">
            <div className={s.prose}>
              <p>
                A weighbridge is a plate in the road with a scale underneath it.
                Carts came in loaded, were weighed, tipped their load and were
                weighed again, and the difference between the two figures was
                what the farmer got paid for. This one worked from 1888 until
                1974 and then stood empty for thirty years. The pit is still
                under the floor. One of the levers is still in the pit.
              </p>
              <p>
                There is no menu. Between six and eleven each morning I find out
                what has actually arrived — four farms, a van from the coast on
                Thursdays, and whatever the garden has decided to do — and write
                down nine or ten courses. At eleven it is fixed, bought and
                portioned for eighteen. You will see it when you sit down. I see
                it about eight hours before you do.
              </p>
              <p>
                That is the whole of the idea and it is the reason for every
                awkward thing further down this page. One dinner a night, cooked
                by two people, for eighteen. There is no kitchen behind the
                kitchen.
              </p>
              <p>
                It is dinner in a small brick room and it takes three hours. I
                would rather you did not call it an experience.
              </p>
            </div>
          </Section>

          <Section number="03" id="terms" title="What you are agreeing to">
            <div className={s.prose}>
              <p className={s.lede}>
                Almost every unhappy evening here has begun the same way:
                somebody had booked something other than what we do. So the
                terms are up here at full size instead of at the bottom in grey.
                None of it is unusual for a room this size. All of it is easier
                to read now than to hear at half past eight.
              </p>
            </div>

            <Term figure="£95" heading="The price is fixed and it is all of it">
              <p>
                Ninety-five pounds a head for nine or ten courses. Service is
                included, there is no discretionary line on the bill, and nobody
                here will suggest one. Wine and anything else you drink is extra
                and itemised. Cards or cash. Splitting the bill is no trouble
                and we are not in a hurry about it.
              </p>
            </Term>

            <Term figure="19:30" heading="Everyone eats at the same time">
              <p>
                The door opens at 19:15 and the room sits together at 19:30.
                There is no second sitting, so a late table is not a table that
                eats later — it is seventeen other people and two cooks waiting.
                We hold seats until 19:45. After that we will have started, and
                you would be coming in partway through, which nobody enjoys.
              </p>
              <p>
                If a train has failed you, ring. The number is at the foot of
                this page and one of us will answer it.
              </p>
            </Term>

            <Term figure="3 hours" heading="Dinner takes about three hours">
              <p>
                Half past seven until about half past ten. It is not drawn out
                for effect and it cannot be compressed; it is nine or ten
                courses cooked to order by two people. If you have a train at
                nine, a sitter until ten, or somewhere to be afterwards, this is
                the wrong night — there is no shorter version of it.
              </p>
            </Term>

            <Term figure="0" heading="You do not choose, and I cannot swap">
              <p>
                Everyone in the room is given the same dinner, in the same
                order, at the same time. There are no substitutions beyond a
                genuine allergy. By eleven in the morning the night is weighed
                and portioned for eighteen, so there is no second version of the
                fourth course in the fridge, and inventing one would mean taking
                it from somebody else.
              </p>
              <p>
                If a plate arrives that you would rather not eat, leave it.
                Nobody will make anything of it or ask you why.
              </p>
            </Term>

            <Term
              figure="at booking"
              heading="Allergies and diets come at booking, not on the night"
            >
              <p>
                Tell us when you book and we will cook around it properly, which
                is a different thing from taking something off a plate. Coeliac,
                nuts, shellfish, dairy: all straightforward with notice. Dinner
                without meat: also straightforward with notice, and it means the
                whole nine courses rather than eight courses and a mushroom.
              </p>
              <p>
                What we cannot do is arrange any of it after eleven on the day,
                and we cannot arrange it at the table. There are a few things we
                cannot work around at all; if yours is one of them we will say
                so within a day of your booking and refund you in full. A
                cancelled booking is a much better outcome than a wasted
                evening.
              </p>
              <p>
                Please keep dislikes off that form. We cannot cook around them
                and it is better that we are not left guessing which of the two
                a line is.
              </p>
            </Term>

            <Term figure="12 and over" heading="Children">
              <p>
                We are a poor room for children, and saying so is fairer than
                seating one. There is a single sitting, it runs three hours past
                most bedtimes, nothing on the table has been designed to be
                liked, and eighteen chairs mean there is nowhere to walk a
                fractious two-year-old. No high chair, no room for a pram.
              </p>
              <p>
                Twelve and over are welcome, are a full seat at the full
                ninety-five pounds, and are now and then the best company in the
                room.
              </p>
            </Term>

            <div className={s.prose}>
              <p className={s.coda}>
                If one of those six is a real problem, it is a real problem, and
                it will still be one at nine o’clock on a Friday with the sixth
                course coming. There is no hard feeling in not booking. I would
                much rather you ate somewhere you liked.
              </p>
            </div>
          </Section>

          <Section number="04" id="wednesday" title="A Wednesday in August">
            <div className={s.prose}>
              <p className={s.lede}>
                An example, not a preview. This is what eighteen people were
                given on Wednesday 13 August. Half of it is out of season
                already and none of it will be on your table. It is here because
                “nine or ten courses decided that morning” is difficult to
                picture, and this is the only honest way to show it.
              </p>
            </div>
            <ol className={s.courses}>
              {COURSES.map((course) => (
                <li key={course}>{course}</li>
              ))}
            </ol>
            <div className={s.prose}>
              <p>
                Then coffee, or not. Nine courses on a poor delivery and ten on
                a good one. Some kitchens do not count the bread. We count the
                bread.
              </p>
              <p>
                There are no photographs on this site. What we cook changes
                every day, and a picture of last month’s plate is a promise I
                would then have to keep.
              </p>
            </div>
          </Section>

          <Section number="05" id="wine" title="Wine">
            <div className={s.prose}>
              <p>
                Twelve bottles and four by the glass. Most of the names will be
                unfamiliar, which is not a position — it is what tastes good at
                the price and what can follow nine courses without shouting over
                them. Nothing is on the list in order to be recognised, and
                there is no bottle here whose job is to be the expensive one.
              </p>
              <p>
                Bottles run from thirty-two pounds to ninety-six, and two thirds
                are under fifty-five. By the glass, seven to eleven. If you would
                rather we chose, say so and we will pour four or five glasses
                across the dinner for thirty-eight pounds a head.
              </p>
              <p>
                Not drinking is entirely ordinary here and nobody will come back
                to ask a second time. There is a good thing made from apples,
                one made from birch sap, a kombucha we make in the cellar, and
                cold water all night at no charge.
              </p>
              <p>
                Bring a bottle you care about if you like. Corkage is twenty
                pounds, and I will not charge it for something I want to taste.
              </p>
            </div>
          </Section>

          <Section number="06" id="bookings" title="Bookings">
            <div className={s.prose}>
              <p>
                Bookings open at 10:00 on the first Monday of the month, for the
                whole of the month after next. Every date goes up at once and it
                is usually gone inside the hour. There is no ballot, no
                membership, no list to join and nothing to be gained by knowing
                us. There is one page and it opens at ten.
              </p>
              <p>
                If you miss it, the next release is a month later. That is the
                entire system. Cancellations do go back on the page during the
                month, so a look on a Tuesday morning is not a waste of time.
              </p>
            </div>

            <Term figure="£0 now" heading="The card">
              <p>
                We take a card when you book, as a guarantee against the seat.
                Nothing is charged at the time, and nothing is charged at all
                unless the paragraph below applies.
              </p>
            </Term>

            <Term figure="72 hours" heading="Changing your mind">
              <p>
                More than seventy-two hours before, tell us and there is nothing
                to pay. Inside seventy-two hours we charge ninety-five pounds
                for each seat we cannot fill, and with eighteen seats we usually
                cannot. Dropping a table of four to a table of two is two
                cancelled seats and works the same way.
              </p>
              <p>
                A seat is transferable. If you cannot come, send somebody else,
                and give us their name and anything they cannot eat by the Monday
                before.
              </p>
              <p>
                If you are ill, ring me. I am not going to argue with you about a
                temperature.
              </p>
            </Term>
          </Section>

          <Section number="07" id="there" title="Getting there">
            <div className={s.prose}>
              <p>
                The Old Weighbridge, Fen Road, Marchbourne. It is the low brick
                building with the iron plate set in the ground outside it, on the
                left where the pavement stops. There is no sign. If you have gone
                under the railway bridge you have overshot by two hundred yards.
              </p>
            </div>

            <Term figure="9 min" heading="On foot">
              <p>
                Nine minutes from the market square, straight down Fen Road. The
                last stretch is unlit, so bring a phone or a torch.
              </p>
            </Term>

            <Term figure="0.9 miles" heading="By train">
              <p>
                Marchbourne station is nine tenths of a mile, about eighteen
                minutes on foot, and there is one taxi rank outside it. Trains
                back are 22:47 and 23:12, and then nothing. The 23:12 works
                comfortably. The 22:47 does not, and people try.
              </p>
            </Term>

            <Term figure="4 spaces" heading="Parking">
              <p>
                Four spaces on the gravel in front, first to arrive. After that,
                the cattle market car park is two hundred yards on and free after
                six. Please do not park on Fen Road itself: it is single track
                and a milk lorry needs it at five in the morning.
              </p>
            </Term>

            <Term figure="ask us" heading="Taxis home">
              <p>
                Two firms in town and both are busy at half past ten on a
                Saturday. Tell us when you sit down and we will book one for the
                end of dinner so that it is outside when you want it.
              </p>
            </Term>
          </Section>

          <Section number="08" id="access" title="Access">
            <div className={s.prose}>
              <p className={s.lede}>
                Including the parts we cannot fix. If any of it matters to you,
                ring rather than work it out from a web page — 01632 960 274,
                and it is quicker in the afternoon.
              </p>
            </div>

            <Term figure="140 mm" heading="The door">
              <p>
                One step, a hundred and forty millimetres, and a portable ramp.
                Tell us at booking and the ramp will be out before you arrive
                rather than fetched while you wait in the road.
              </p>
            </Term>

            <Term figure="2 of 18" heading="The room">
              <p>
                All on one level. The floor is the original brick and it is
                uneven around the pit cover. Two of the eighteen places have room
                for a wheelchair to stay at the table; ask when you book and they
                are held for you.
              </p>
            </Term>

            <Term figure="760 mm" heading="The lavatory">
              <p>
                On the same level, seven hundred and sixty millimetre door, grab
                rail on the right. It is a converted weighbridge office and it is
                not a fully accessible lavatory. If that is a problem, ring and I
                will describe it properly instead of guessing in writing.
              </p>
            </Term>

            <Term figure="no music" heading="Sound and light">
              <p>
                There is no music, ever. Eighteen people in a brick room is
                louder than it ought to be, and the hard end of the room is the
                one nearest the pass. The light is low but you will be able to
                read. We read the dishes out at the table, and there is a large
                print card if you would rather have it in your hand.
              </p>
            </Term>

            <Term figure="assistance" heading="Dogs">
              <p>
                Guide and assistance dogs, of course — tell us at booking so
                there is floor kept clear. Otherwise, no.
              </p>
            </Term>
          </Section>

          <hr className={s.sectionRule} />
          <p className={s.sectionNumber} aria-hidden="true">
            09
          </p>
          <div className={s.bookBlock}>
            <h2 className={s.sectionTitle} id="book">
              Book a seat
            </h2>
            <p>
              Party size, allergies, dietary requirements and a card against the
              seat. Six confirmations that you know what the evening is. Five
              minutes, and it is the last chance either of us gets to find a
              misunderstanding cheaply.
            </p>
            <Link className={s.bookLink} href="/r/traditional-websites-restaurant/book">
              Begin a booking
            </Link>
            <p className={s.demoNote}>
              A demonstration. No table can actually be reserved here and nothing
              you type is sent anywhere.
            </p>
          </div>

          <hr className={s.sectionRule} />

          <footer className={s.colophon}>
            <div className={s.colophonBlock}>
              <h2 className={s.colophonHeading}>Address</h2>
              <p>
                The Old Weighbridge, Fen Road
                <br />
                Marchbourne
              </p>
              <p>
                <a href="tel:+441632960274">01632 960 274</a>
                <br />
                <a href="mailto:dinner@weighbridge.example">
                  dinner@weighbridge.example
                </a>
              </p>
            </div>
            <div className={s.colophonBlock}>
              <h2 className={s.colophonHeading}>Hours</h2>
              <p>
                Wednesday to Sunday
                <br />
                One sitting, 19:30
              </p>
              <p>
                The telephone is answered from two until five, and not while we
                are cooking.
              </p>
            </div>
            <div className={s.colophonBlock}>
              <h2 className={s.colophonHeading}>Other</h2>
              <p>
                Cooked by two people, one of whom owns it. There is no press
                page and no photographs; if you are writing something, ring and
                ask, but the answer is usually that there is nothing much to
                add.
              </p>
            </div>
            <div className={s.disclosure}>
              <p>
                Weighbridge is not a real restaurant and Marchbourne is not a
                real town. Every figure, dish and policy on this page was written
                for a reference implementation of a restaurant site whose real
                job is expectation management rather than persuasion. Nothing
                here can be booked.
              </p>
              <p>
                {/* Crossing into the catalogue's root layout is a full page
                    load, which is right: that is a different piece of work. */}
                <Link
                  href="/tasks/traditional-websites-restaurant"
                  prefetch={false}
                >
                  Read the brief this was built from
                </Link>
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
