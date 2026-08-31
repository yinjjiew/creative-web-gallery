import type { Metadata } from "next";

import { BookingFlow } from "./BookingFlow";

export const metadata: Metadata = {
  title: "Book a seat — Weighbridge",
  description:
    "A demonstration booking form: party size, allergies, dietary requirements, a card against the seat, and six confirmations that you know what the evening is.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function BookPage() {
  return <BookingFlow />;
}
