"use client";

import dynamic from "next/dynamic";

import styles from "./natt.module.css";

const Cabin = dynamic(() => import("./Cabin"), {
  ssr: false,
  loading: () => <div className={styles.boot} aria-hidden="true" />,
});

export default function Natt() {
  return <Cabin />;
}
