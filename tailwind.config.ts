import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Inverted from the original light greyscale ramp (950=darkest text,
        // 5=lightest bg) to a dark theme — same tones, roles swapped, so
        // every bg-ink-*/text-ink-* usage across the app flips automatically.
        ink: {
          950: "#fafafa",
          900: "#f7f7f7",
          700: "#f4f4f4",
          500: "#efefef",
          300: "#e8e8e8",
          200: "#e4e4e4",
          150: "#d9d9d9",
          100: "#c9c9c9",
          75: "#b4b4b4",
          50: "#7a7a7a",
          25: "#5e5e5e",
          10: "#101010",
          5: "#0f0f0f",
        },
      },
      fontFamily: {
        serif: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Space Grotesk'", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      keyframes: {
        ring: {
          "0%": { transform: "scale(.55)", opacity: "0.75" },
          "70%": { transform: "scale(2.6)", opacity: "0" },
          "100%": { transform: "scale(2.6)", opacity: "0" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.62" },
          "50%": { opacity: "1" },
        },
        tickerIn: {
          "0%": { transform: "translate(-50%, -14px)", opacity: "0" },
          "100%": { transform: "translate(-50%, 0)", opacity: "1" },
        },
      },
      animation: {
        ring: "ring 1.9s ease-out infinite",
        breathe: "breathe 3.6s ease-in-out infinite",
        tickerIn: "tickerIn .4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
