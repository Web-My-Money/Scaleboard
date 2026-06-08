// AUTO-GENERATED from docs/input/DESIGN.md by scripts/build-design-tokens.ts.
// Do not edit by hand; edit DESIGN.md and run `npm run build:tokens`.

export const designTokens = {
  name: "WMM Dark",
  colors: {
    primary: "#8fccb6",
    secondary: "#1f2d56",
    success: "#8fccb6",
    warning: "#E89558",
    danger: "#e05c6a",
    surface: "#0f1624",
    text: "#fbfbfb",
    neutral: "#080c14",
  },
  typography: {
    h1: {"fontFamily":"Satoshi","fontSize":"3.5rem"},
    bodyMd: {"fontFamily":"Inter","fontSize":"1rem"},
    labelCaps: {"fontFamily":"Space Grotesk","fontSize":"0.6875rem"},
    weights: "100, 200, 300, 400, 500, 600, 700, 800, 900",
  },
  radii: {
    sm: "8px",
    md: "12px",
  },
  spacing: {
    sm: "8px",
    md: "16px",
  },
} as const;

export type DesignTokens = typeof designTokens;
