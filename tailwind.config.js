/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Placeholder palette — replace with real values pulled from the
        // bakery's existing logo/icon before building the public pages.
        // Keep this as the single source of truth so colors stay consistent
        // across every page instead of being hardcoded per-component.
        brand: {
          cream: "#FBF6EF",
          crust: "#7A4B32",
          accent: "#D97757",
          ink: "#2E2119",
        },
      },
      fontFamily: {
        // Placeholder fonts — pick real display/body faces during the
        // Phase 2 (public menu page) design pass, matching the brand's
        // warm/cozy voice from the marketing prompt.
        display: ["Georgia", "serif"],
        body: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
