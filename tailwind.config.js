/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Extracted directly from the real JiaPan Bakery logo
        // (public/logo-reference.jpg) — not a generic placeholder palette.
        // cream/paper: the logo's warm ivory background
        // ink: the deep espresso-brown used for all linework and the
        //      script wordmark
        // latte: the soft warm tan used to shade the illustrated cheesecake
        // crust: a mid-tone between ink and latte, used for interactive
        //        elements (links, secondary buttons) where latte alone
        //        wouldn't have enough contrast against the cream background
        brand: {
          cream: "#FDF8F3",
          paper: "#FFFFFF",
          ink: "#2B1D10",
          latte: "#B4A390",
          crust: "#7A5738",
        },
      },
      fontFamily: {
        // Refined serif for headings/prices — echoes the small-caps
        // "bakery" wordmark under the logo's script.
        display: ["var(--font-display)", "serif"],
        // Flowing script — used sparingly, only for the site's own
        // wordmark, mirroring the hand-lettered "JiaPan" logotype.
        script: ["var(--font-script)", "cursive"],
        // Clean, warm sans for body text and all interactive UI
        // (forms, buttons) where legibility matters most.
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
