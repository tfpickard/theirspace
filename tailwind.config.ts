import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--fg)",
        card: "var(--card)",
        border: "var(--border)",
        accent: "var(--accent)",
        muted: "var(--muted)",
        primary: "var(--primary)",
        secondary: "var(--secondary)"
      },
      boxShadow: {
        neon: "0 0 0 2px var(--accent), 0 0 18px color-mix(in srgb, var(--accent) 40%, transparent)"
      },
      fontFamily: {
        headline: "var(--font-headline)",
        body: "var(--font-body)",
        mono: "var(--font-mono)"
      },
      backgroundImage: {
        grid: "linear-gradient(90deg, color-mix(in srgb, var(--border) 30%, transparent) 1px, transparent 1px), linear-gradient(color-mix(in srgb, var(--border) 30%, transparent) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
