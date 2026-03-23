import type { Palette } from "@mui/material/styles/createPalette";
import defaultDark from "./defaultDark";
import defaultLight from "./defaultLight";

export type PaletteMode = "dark" | "light";

export interface PaletteEntry {
    id: string;               // unikalny klucz (np. "space")
    name: string;             // przyjazna nazwa (np. "Space")
    description?: string;
    author?: string;
    dark: Palette;
    light: Palette;
}

const registry = new Map<string, PaletteEntry>();

export function registerPalette(entry: {
    id: string;
    name: string;
    description?: string;
    author?: string;
    dark: Palette;
    light: Palette;
    overwrite?: boolean;
}): void {
    const { id, name, description, author, dark, light, overwrite } = entry;
    if (!overwrite && registry.has(id)) {
        throw new Error(`Palette with id "${id}" already registered`);
    }
    registry.set(id, {
        id,
        name,
        description,
        author,
        dark,
        light,
    });
}

export function getPaletteEntry(id: string): PaletteEntry | undefined {
    return registry.get(id);
}

export function hasPalette(id: string): boolean {
    return registry.has(id);
}

export function listPalettes(): Array<Pick<PaletteEntry, "id" | "name" | "description" | "author">> {
    return Array.from(registry.values()).map(({ id, name, description, author }) => ({
        id, name, description, author
    }));
}

export function getPalette(id: string, mode: PaletteMode): Palette {
    const entry = registry.get(id);
    if (!entry) {
        return mode === "dark" ? defaultDark : defaultLight;
    }
    return mode === "dark" ? entry.dark : entry.light;
}

export function clearRegistry(): void {
    registry.clear();
}

export default {
    registerPalette,
    getPaletteEntry,
    hasPalette,
    listPalettes,
    getPalette,
    clearRegistry,
};