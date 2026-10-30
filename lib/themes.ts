export const themes = [
  { id: "light", label: "Light", mode: "light" },
  { id: "dark", label: "Dark", mode: "dark" },
  { id: "rider-dark", label: "Rider Dark", mode: "dark" },
  { id: "dracula", label: "Dracula", mode: "dark" },
  { id: "one-dark", label: "Atom One Dark", mode: "dark" },
  { id: "one-light", label: "Atom One Light", mode: "light" },
  { id: "vscode-dark", label: "VS Code Dark+", mode: "dark" },
  { id: "vscode-light", label: "VS Code Light+", mode: "light" },
  { id: "github-dark", label: "GitHub Dark", mode: "dark" },
  { id: "github-light", label: "GitHub Light", mode: "light" },
  { id: "nord", label: "Nord", mode: "dark" },
  { id: "solarized-dark", label: "Solarized Dark", mode: "dark" },
  { id: "solarized-light", label: "Solarized Light", mode: "light" },
  { id: "monokai", label: "Monokai", mode: "dark" },
] as const;
export type Theme = (typeof themes)[number]["id"];
export type DarkTheme = Extract<
  (typeof themes)[number],
  { mode: "dark" }
>["id"];
export const themeStorageKey = "code-desk:v1:theme";
export function isTheme(value: unknown): value is Theme {
  return themes.some((theme) => theme.id === value);
}
export function isDarkTheme(value: Theme): value is DarkTheme {
  return themes.some((theme) => theme.id === value && theme.mode === "dark");
}

// Editor-inspired palettes shared by Python and C#.
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

  "one-dark": {
    keyword: "#c678dd",
    string: "#98c379",
    number: "#d19a66",
    comment: "#7f8899",
    function: "#61afef",
    type: "#e5c07b",
    variable: "#abb2bf",
  },
  "one-light": {
    keyword: "#a626a4",
    string: "#50a14f",
    number: "#986801",
    comment: "#767b85",
    function: "#4078f2",
    type: "#986801",
    variable: "#383a42",
  },
  "vscode-dark": {
    keyword: "#c586c0",
    string: "#ce9178",
    number: "#b5cea8",
    comment: "#7da56b",
    function: "#dcdcaa",
    type: "#4ec9b0",
    variable: "#9cdcfe",
  },
  "vscode-light": {
    keyword: "#af00db",
    string: "#a31515",
    number: "#098658",
    comment: "#008000",
    function: "#795e26",
    type: "#267f99",
    variable: "#001080",
  },
  "github-dark": {
    keyword: "#ff7b72",
    string: "#a5d6ff",
    number: "#79c0ff",
    comment: "#8b949e",
    function: "#d2a8ff",
    type: "#ffa657",
    variable: "#c9d1d9",
  },
  "github-light": {
    keyword: "#cf222e",
    string: "#0a3069",
    number: "#0550ae",
    comment: "#6e7781",
    function: "#8250df",
    type: "#953800",
    variable: "#24292f",
  },
  nord: {
    keyword: "#81a1c1",
    string: "#a3be8c",
    number: "#b48ead",
    comment: "#8994a9",
    function: "#88c0d0",
    type: "#8fbcbb",
    variable: "#d8dee9",
  },
  "solarized-dark": {
    keyword: "#859900",
    string: "#2aa198",
    number: "#d33682",
    comment: "#839496",
    function: "#268bd2",
    type: "#b58900",
    variable: "#93a1a1",
  },
  "solarized-light": {
    keyword: "#667600",
    string: "#187c75",
    number: "#b02768",
    comment: "#6a7d83",
    function: "#206fa8",
    type: "#886600",
    variable: "#586e75",
  },
  monokai: {
    keyword: "#f92672",
    string: "#e6db74",
    number: "#ae81ff",
    comment: "#a2a394",
    function: "#a6e22e",
    type: "#66d9ef",
    variable: "#f8f8f2",
  },
} satisfies Record<Theme, Record<string, string>>;
