"use client";

import dynamic from "next/dynamic";

import styles from "./formant.module.css";

const Plate = dynamic(() => import("./Plate"), {
  ssr: false,
  loading: () => <div className={styles.pending} aria-hidden="true" />,
});

export default function Field() {
  return <Plate />;
}
