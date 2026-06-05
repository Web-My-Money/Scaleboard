// AUTO-GENERATED from docs/input/DESIGN.md by scripts/build-design-tokens.ts.
// Do not edit by hand; edit DESIGN.md and run `npm run build:tokens`.

export const designTokens = {
  name: "Glassmorphism",
  colors: {
    primary: "#1856FF",
    secondary: "#3A344E",
    success: "#07CA6B",
    warning: "#E89558",
    danger: "#EA2143",
    surface: "#FFFFFF",
    text: "#141414",
    neutral: "#FFFFFF",
  },
  typography: {
    h1: {"fontFamily":"Plus Jakarta Sans","fontSize":"3rem"},
    bodyMd: {"fontFamily":"Plus Jakarta Sans","fontSize":"1rem"},
    labelCaps: {"fontFamily":"JetBrains Mono","fontSize":"0.75rem"},
    weights: "100, 200, 300, 400, 500, 600, 700, 800, 900",
  },
  radii: {
    sm: "4px",
    md: "8px",
  },
  spacing: {
    sm: "8px",
    md: "16px",
  },
} as const;

export type DesignTokens = typeof designTokens;
