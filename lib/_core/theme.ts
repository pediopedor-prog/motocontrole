/**
 * Theme configuration for MotoControle app.
 * Defines color schemes, fonts, and theme utilities.
 * Colors match theme.config.js for consistency.
 */

export type ColorScheme = "light" | "dark";

export interface ThemeColorPalette {
  primary: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

export const SchemeColors: Record<ColorScheme, ThemeColorPalette> = {
  light: {
    primary: "#1B5E20",
    background: "#F5F7FA",
    surface: "#FFFFFF",
    foreground: "#1A1A1A",
    muted: "#6B7280",
    border: "#E5E7EB",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    text: "#1A1A1A",
    tint: "#1B5E20",
    icon: "#6B7280",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#1B5E20",
  },
  dark: {
    primary: "#4CAF50",
    background: "#121212",
    surface: "#1E1E1E",
    foreground: "#F0F0F0",
    muted: "#9CA3AF",
    border: "#2D2D2D",
    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#F87171",
    text: "#F0F0F0",
    tint: "#4CAF50",
    icon: "#9CA3AF",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#4CAF50",
  },
};

export const Colors: Record<ColorScheme, ThemeColorPalette> = SchemeColors;

export const ThemeColors: Record<ColorScheme, ThemeColorPalette> = SchemeColors;

export const Fonts = {
  regular: {
    fontFamily: "System",
    fontWeight: "400" as const,
  },
  medium: {
    fontFamily: "System",
    fontWeight: "500" as const,
  },
  semiBold: {
    fontFamily: "System",
    fontWeight: "600" as const,
  },
  bold: {
    fontFamily: "System",
    fontWeight: "700" as const,
  },
};
