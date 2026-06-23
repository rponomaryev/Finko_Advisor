import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        finko: {
          bg: "var(--finko-bg)",
          surface: "var(--finko-surface)",
          text: "var(--finko-text)",
          muted: "var(--finko-muted)",
          border: "var(--finko-border)",
          primary: "var(--finko-primary)",
          primaryDark: "var(--finko-primary-dark)",
          primaryLight: "var(--finko-primary-light)",
          black: "var(--finko-black)",
          white: "var(--finko-white)",
          warning: "var(--finko-warning)",
          danger: "var(--finko-danger)",
          success: "var(--finko-success)",
          info: "var(--finko-info)"
        }
      },
      borderRadius: {
        finko: "var(--finko-radius-card)",
        "finko-button": "var(--finko-radius-button)"
      },
      boxShadow: {
        finko: "0 18px 55px rgba(17, 24, 39, 0.08)",
        "finko-soft": "0 10px 30px rgba(17, 24, 39, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
