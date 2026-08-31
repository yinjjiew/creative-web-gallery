"use client";

import { Archivo, Spline_Sans_Mono } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], display: "swap" });
const mono = Spline_Sans_Mono({ subsets: ["latin"], display: "swap" });

export default function Page() {
  return (
    <main className={archivo.className}>
      <h1>Leva</h1>
      <p className={mono.className}>SPLINE SANS MONO 0123456789</p>
    </main>
  );
}
