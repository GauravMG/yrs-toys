import type { Config } from "tailwindcss";
// Imported from the file directly (not the `@yrs/ui` package barrel) because
// tailwind loads this config with jiti, which — unlike Vite's own resolver —
// doesn't map the barrel's `./components/Button.js`-style specifiers back to
// their `.tsx` sources. tailwind-preset.ts only pulls in plain `.ts` token
// files, so a deep import sidesteps that entirely.
import tailwindPreset from "@yrs/ui/src/tailwind-preset";

export default {
  presets: [tailwindPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
} satisfies Config;
