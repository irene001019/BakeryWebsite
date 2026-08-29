import { Cormorant_Garamond, Mrs_Saint_Delafield, Work_Sans } from "next/font/google";
import "./globals.css";

// Refined serif for headings/prices — echoes the tracked small-caps
// "bakery" wordmark under the logo's script.
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

// Flowing single-stroke script — mirrors the hand-lettered "JiaPan"
// logotype. Used sparingly (just the site wordmark), per design intent.
const script = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

// Clean, warm sans for body copy and every interactive control
// (forms, buttons) — legibility comes first there.
const body = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata = {
  title: "JiaPan Bakery",
  description: "Japanese & Basque cheesecakes, fresh buns — handmade every weekend.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${script.variable} ${body.variable}`}>
      <body className="bg-brand-cream text-brand-ink font-body">
        {children}
      </body>
    </html>
  );
}
