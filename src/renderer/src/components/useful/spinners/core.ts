
export const spinnerColorsLight = [
    "#1976d2", // niebieski
    "#43a047", // zielony
    "#fbc02d", // żółty
    "#e53935", // czerwony
];
export const spinnerColorsDark = [
    "#90caf9", // jasnoniebieski
    "#a5d6a7", // jasnozielony
    "#fff59d", // jasnobrązowy
    "#ef9a9a", // jasnoczerwony
];

export type LoadingOverlayMode = "auto" | "small" | "full";

export const getRandomDelays = (count: number, min = -0.5, max = 0.0) =>
    Array.from({ length: count }, () =>
        (Math.random() * (max - min) + min).toFixed(2) + "s"
    );

export function shuffleArray<T>(array: T[]): T[] {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ========== Typy spinnerów ==========
export type SpinnerType = "ring" | "dots" | "bars" | "pulse" | "grid" | "orbit" | "wave" | "hexagon" | "bounce" | "ripple" | "gears" | "flip" | "cube" | "particles" | "clock" | "infinity";

export const SPINNER_TYPES: SpinnerType[] = ["ring", "dots", "bars", "pulse", "grid", "orbit", "wave", "hexagon", "bounce", "ripple", "gears", "flip", "cube", "particles", "clock", "infinity"];