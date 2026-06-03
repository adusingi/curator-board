export const DEFAULT_THEME_ID = "vesper";

type ThemeDefinition = {
  id: string;
  group: "dark" | "light";
  label: string;
  variables: Record<string, string>;
};

export const themes: ThemeDefinition[] = [
  {
    id: "vesper",
    group: "dark",
    label: "vesper",
    variables: {
      "background": "#0f111a",
      "background-rgb": "15 17 26",
      "panel": "#141726",
      "panel-soft": "#1b1f33",
      "line": "#2a2f46",
      "line-strong": "#7fa7ff",
      "foreground": "#f3e8e2",
      "muted": "#9aa2c1",
      "muted-soft": "#69708b",
      "accent": "#89adff",
      "accent-strong": "#c8d8ff",
      "accent-wash": "rgba(137, 173, 255, 0.14)",
      "chip-background": "#1d2236",
      "chip-foreground": "#c9d7ff",
      "card-shadow": "0 18px 50px rgba(3, 5, 14, 0.34)",
      "page-gradient": "radial-gradient(circle at top left, rgba(137, 173, 255, 0.16), transparent 32%), linear-gradient(180deg, #121523 0%, #0f111a 100%)",
    },
  },
];

export function buildThemeStyles() {
  return themes
    .map(
      (theme) => `
html[data-theme="${theme.id}"] {
${Object.entries(theme.variables)
  .map(([key, value]) => `  --${key}: ${value};`)
  .join("\n")}
}`,
    )
    .join("\n\n");
}
