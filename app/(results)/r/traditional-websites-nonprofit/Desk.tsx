"use client";

import { HONESTY, IMPACT, PHONE_DISPLAY, PHONE_TEL } from "./copy";
import { PHONE_HOURS, ROOMS } from "./hours";
import s from "./duty.module.css";

const MAIL =
  "mailto:desk@duty.example?subject=Duty%20—%20from%20the%20site&body=";

type Props = {
  onBack: () => void;
};

export function Desk({ onBack }: Props) {
  return (
    <div className={s.desk}>
      <button type="button" className={s.backCrisis} onClick={onBack}>
        Back — I need help
      </button>

      <p className={s.deskWarn}>
        This part is not for people in trouble. The number is still{" "}
        <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>. If you are here by mistake,
        use the button above.
      </p>

      <section className={s.deskBlock} aria-labelledby="who">
        <h2 id="who">Who this is</h2>
        <p>
          Duty is a modelled free legal advice clinic in Ormside, England. Two
          solicitors and thirty volunteers. We do housing, debt, benefits and
          work. We run a phone line and three drop-ins. We take a small number
          of cases after we have seen someone.
        </p>
        <p className={s.quiet}>{HONESTY}</p>
      </section>

      <section className={s.deskBlock} aria-labelledby="refer">
        <h2 id="refer">I want to refer someone</h2>
        <p>
          If you are a worker at the council or another charity: call the duty
          line and say you are referring. Do not send the person this page and
          leave. Stay on the line, or sit with them while they call.
        </p>
        <p>
          We do not take casework by email from the public. A worker may send
          one page — name, the letter, the date — from their work address.
        </p>
        <p>
          <a className={s.textLink} href={`${MAIL}I%20am%20a%20worker%20referring%20someone.`}>
            Open a message to the desk
          </a>
          <span className={s.quiet}> — this uses your own email. Nothing is sent by this page.</span>
        </p>
      </section>

      <section className={s.deskBlock} aria-labelledby="vol">
        <h2 id="vol">I want to volunteer</h2>
        <p>
          We have thirty volunteers. You need one evening of training and a DBS
          check. After that you can sit on a Saturday desk with a solicitor in
          the room.
        </p>
        <form
          className={s.form}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const name = String(data.get("name") ?? "").trim();
            const when = String(data.get("when") ?? "").trim();
            const body = encodeURIComponent(
              `Name: ${name}\nWhen I can come: ${when}\n\nI would like to volunteer.`,
            );
            window.location.href = `${MAIL}${body}`;
          }}
        >
          <label className={s.field}>
            <span>Your name</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label className={s.field}>
            <span>When you can come</span>
            <input name="when" type="text" required />
          </label>
          <button type="submit" className={s.formGo}>
            Open in my email
          </button>
          <p className={s.quiet}>
            The form does not leave this device. It opens your own mail app.
            desk@duty.example is a modelled address and will not arrive.
          </p>
        </form>
      </section>

      <section className={s.deskBlock} aria-labelledby="give">
        <h2 id="give">I want to give money</h2>
        <p>
          If this were a real clinic, the account details would sit here — not
          on the front of the site. Duty is modelled. There is no account, and
          these figures cannot receive money.
        </p>
        <dl className={s.ledger}>
          <div>
            <dt>Name</dt>
            <dd>Duty Advice (modelled)</dd>
          </div>
          <div>
            <dt>Sort code</dt>
            <dd>00-00-00</dd>
          </div>
          <div>
            <dt>Account</dt>
            <dd>00000000</dd>
          </div>
        </dl>
      </section>

      <section className={s.deskBlock} aria-labelledby="fund">
        <h2 id="fund">Accounts and impact</h2>
        <p>
          For a funder or a local authority. These numbers are modelled. They
          stand in for a Charity Commission return, which a real clinic would
          publish as a PDF.
        </p>
        <table className={s.table}>
          <caption className={s.quiet}>Modelled year — not a real return</caption>
          <thead>
            <tr>
              <th scope="col">What</th>
              <th scope="col">Figure</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {IMPACT.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={s.deskBlock} aria-labelledby="rooms">
        <h2 id="rooms">The three rooms</h2>
        <p>Phone: {PHONE_HOURS}</p>
        <ul className={s.roomList}>
          {ROOMS.map((room) => (
            <li key={room.id}>
              <span className={s.mono}>{room.when}</span>
              <span>{room.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
