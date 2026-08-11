/**
 * Design-system source of truth. Primary language is the warm, artisanal
 * mockup (cream/gold/sage/terracotta). `coral` and `teal` are the two
 * accents borrowed from the bold mockup — used ONLY for Sale badges,
 * verified-purchase / in-stock indicators, never structurally (no borders,
 * no backgrounds on large surfaces).
 */
export const colors = {
  cream: "#FBF7EF",
  creamDark: "#F1E9D8",
  panel: "#FFFFFF",
  ink: "#2E2A24",
  inkSoft: "#5C574C",
  gold: "#C08A3E",
  goldDark: "#A2712F",
  goldLight: "#E6C674",
  sage: "#8FA073",
  terracotta: "#CC8064",
  rose: "#D9A6A0",
  line: "#E7DFCC",
  // borrowed accents — restrained use only, see note above
  coral: "#EF6F5C",
  teal: "#7CC4B0",
} as const;

export type ColorToken = keyof typeof colors;
