import type { Config } from "tailwindcss";
// Imported from the package's source file directly (not the `@yrs/ui`
// package entry point) because the Tailwind config is loaded by `jiti`
// outside Vite's own resolver, and jiti can't follow the `.js`-suffixed
// specifiers in `@yrs/ui/src/index.ts` through to their `.tsx` component
// files. The preset module itself only pulls in plain `.ts` token files, so
// this path resolves cleanly.
import tailwindPreset from "../../packages/ui/src/tailwind-preset.js";

export default {
  presets: [tailwindPreset as Config],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
