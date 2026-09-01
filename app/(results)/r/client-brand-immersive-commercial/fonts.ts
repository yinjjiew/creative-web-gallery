import { Familjen_Grotesk, Fragment_Mono, Literata } from "next/font/google";

/**
 * Literata is the spoken sentence — here, there, the claim. It was cut for
 * long reading, not for luxury display, which is the register of a working
 * night train rather than a cruise.
 *
 * Familjen Grotesk is Swedish and plain: the operator, the pocket, the form.
 * Fragment Mono is the timetable and the berth plate, the type that already
 * lives on a reservation.
 */
export const display = Literata({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

export const sans = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const mono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-mono",
});

export const fontClass = `${display.variable} ${sans.variable} ${mono.variable}`;
