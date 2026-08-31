"use client";

/**
 * Three exercises that ask for a prediction before showing the answer.
 *
 * Answering is what turns the picture into a rule, so nothing is revealed until
 * a choice has been made, and every reveal shows the arithmetic rather than
 * asserting the result. Each exercise can be loaded into the chart above.
 */

import { useState } from "react";

import styles from "./reversal.module.css";
import { QUESTIONS } from "./data";
import type { Setup } from "./model";

type Props = {
  onLoad: (setup: Setup) => void;
};

export default function Predict({ onLoad }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <div className={styles.quiz}>
      {QUESTIONS.map((question, index) => {
        const chosen = answers[question.id];
        const right = chosen === question.answer;
        return (
          <div className={styles.card} key={question.id}>
            <p className={styles.cardNum}>Exercise {index + 1} of 3</p>
            <p className={styles.cardPrompt}>{question.prompt}</p>

            <fieldset className={styles.choices}>
              <legend className={styles.srOnly}>
                Exercise {index + 1}: choose an answer
              </legend>
              {question.options.map((option) => (
                <label className={styles.choice} key={option.id}>
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={chosen === option.id}
                    onChange={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.id]: option.id,
                      }))
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>

            {chosen ? (
              <div className={styles.reveal}>
                <p
                  className={`${styles.mark} ${right ? styles.markRight : styles.markWrong}`}
                  role="status"
                >
                  {right ? "Correct" : "Not this one"}
                </p>
                <ul className={styles.working}>
                  {question.because.map((line) => (
                    <li key={line.slice(0, 20)}>{line}</li>
                  ))}
                </ul>
                <p className={styles.lesson}>{question.lesson}</p>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => onLoad(question.setup)}
                >
                  Put these numbers in the chart
                </button>
              </div>
            ) : (
              <p className={styles.presetNote}>
                Commit to an answer to see the arithmetic.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
