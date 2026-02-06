import { z } from "zod";

export const FONT_CHOICES = [
  "Georgia, serif",
  "\"Times New Roman\", serif",
  "\"Courier New\", monospace",
  "\"Trebuchet MS\", sans-serif",
  "\"Verdana\", sans-serif"
] as const;

const color = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "Must be a hex color");

export const ThemeSchema = z.object({
  bg: color,
  fg: color,
  card: color,
  border: color,
  accent: color,
  primary: color,
  secondary: color,
  muted: color,
  fontHeadline: z.enum(FONT_CHOICES),
  fontBody: z.enum(FONT_CHOICES),
  fontMono: z.literal("\"Courier New\", monospace"),
  pattern: z.enum(["grid", "none"])
});

export type ThemeTokens = z.infer<typeof ThemeSchema>;

export const DEFAULT_THEME: ThemeTokens = {
  bg: "#f7f4ff",
  fg: "#1b1b1b",
  card: "#ffffff",
  border: "#c3b5ff",
  accent: "#ff7ad9",
  primary: "#3a2b71",
  secondary: "#7f63ff",
  muted: "#f1ecff",
  fontHeadline: "\"Trebuchet MS\", sans-serif",
  fontBody: "Georgia, serif",
  fontMono: "\"Courier New\", monospace",
  pattern: "grid"
};
