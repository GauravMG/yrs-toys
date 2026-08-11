import type { Config } from "tailwindcss";
import { colors } from "./tokens/colors.js";
import { fontFamily } from "./tokens/typography.js";
import { radius } from "./tokens/radius.js";
import { shadows } from "./tokens/shadows.js";

const preset: Pick<Config, "theme"> = {
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: colors.cream, dark: colors.creamDark },
        panel: colors.panel,
        ink: { DEFAULT: colors.ink, soft: colors.inkSoft },
        gold: { DEFAULT: colors.gold, dark: colors.goldDark, light: colors.goldLight },
        sage: colors.sage,
        terracotta: colors.terracotta,
        rose: colors.rose,
        line: colors.line,
        coral: colors.coral,
        teal: colors.teal,
      },
      fontFamily: {
        display: fontFamily.display,
        body: fontFamily.body,
      },
      borderRadius: {
        sm: radius.sm,
        DEFAULT: radius.DEFAULT,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
        full: radius.full,
      },
      boxShadow: {
        card: shadows.card,
        soft: shadows.soft,
        pop: shadows.pop,
      },
      keyframes: {
        bump: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.5)" },
          "100%": { transform: "scale(1)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(10px) scale(.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "toast-out": {
          to: { opacity: "0", transform: "translateX(20px)" },
        },
      },
      animation: {
        bump: "bump .4s cubic-bezier(.34,1.56,.64,1)",
        "toast-in": "toast-in .3s cubic-bezier(.22,1,.36,1)",
        "toast-out": "toast-out .25s forwards",
      },
    },
  },
};

export default preset;
