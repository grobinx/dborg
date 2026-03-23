import { registerPalette } from "./registry";
import darkPalette from "./defaultDark";
import lightPalette from "./defaultLight";

registerPalette({
    id: "default",
    name: "Default",
    description: "The default dark and light palette.",
    author: "Andrzej Kałuża",
    dark: darkPalette,
    light: lightPalette,
});