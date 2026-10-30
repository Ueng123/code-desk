export type Theme = "light" | "dark" | "rider-dark" | "dracula";
export type DarkTheme = Exclude<Theme, "light">;
export const themeStorageKey = "code-desk:v1:theme";
export function isTheme(value: unknown): value is Theme {
  return (
    value === "light" ||
    value === "dark" ||
    value === "rider-dark" ||
    value === "dracula"
  );
}

// Palettes inspired by Rider Dark and Dracula, shared by Python and C#.
export const syntaxPalettes = {
  light: {
    keyword: "#8959a8",
    string: "#427738",
    number: "#9c5d19",
    comment: "#778579",
    function: "#286b92",
    type: "#986b24",
    variable: "#243c34",
  },
  dark: {
    keyword: "#c792ea",
    string: "#c3e88d",
    number: "#f7b777",
    comment: "#82978d",
    function: "#82aaff",
    type: "#ffcb6b",
    variable: "#d6e4dc",
  },
  "rider-dark": {
    keyword: "#6c95eb",
    string: "#c9a26d",
    number: "#ed94c0",
    comment: "#85c46c",
    function: "#39cc9b",
    type: "#c191ff",
    variable: "#bcbec4",
  },
  dracula: {
    keyword: "#ff79c6",
    string: "#f1fa8c",
    number: "#bd93f9",
    comment: "#8796c6",
    function: "#50fa7b",
    type: "#8be9fd",
    variable: "#f8f8f2",
  },
} satisfies Record<Theme, Record<string, string>>;
