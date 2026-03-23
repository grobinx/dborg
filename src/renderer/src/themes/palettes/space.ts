import { registerPalette } from "./registry";
import darkPalette from "./darkSpace";
import lightPalette from "./lightSpace";

registerPalette({
    id: "space",
    name: "Space",
    description: "A dark and light palette inspired by the vastness of space.",
    author: "Andrzej Kałuża",
    dark: darkPalette,
    light: lightPalette,
});