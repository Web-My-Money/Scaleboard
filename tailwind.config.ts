import type { Config } from "tailwindcss";
import { designTokens } from "./lib/design-tokens/tokens";

const { colors, spacing, radii, typography } = designTokens;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        surface: colors.surface,
        text: colors.text,
        neutral: colors.neutral,
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        h1: typography.h1.fontSize,
        body: typography.bodyMd.fontSize,
        "label-caps": typography.labelCaps.fontSize,
      },
      spacing: {
        "sm-token": spacing.sm,
        "md-token": spacing.md,
      },
      borderRadius: {
        "sm-token": radii.sm,
        "md-token": radii.md,
      },
      backdropBlur: {
        glass: "12px",
      },
      backgroundColor: {
        "glass-surface": "rgba(255, 255, 255, 0.6)",
        "glass-elevated": "rgba(255, 255, 255, 0.78)",
      },
      borderColor: {
        "glass-border": "rgba(255, 255, 255, 0.4)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(20, 20, 20, 0.08)",
        "glass-lg": "0 16px 48px rgba(20, 20, 20, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
