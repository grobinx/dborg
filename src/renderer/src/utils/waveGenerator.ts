import { darken, lighten } from "@mui/material";

const generateColorScale = (baseColor: string, count: number) => {
    if (count <= 1) return [baseColor];

    const mid = Math.floor(count / 2);       // bazowy kolor w środku (dla parzystych: po lewej z pary środkowej)
    const leftMax = mid;                      // maks. odległość na lewo
    const rightMax = count - mid - 1;         // maks. odległość na prawo
    const maxDelta = 0.3;                     // maks. stopień rozjaśnienia/przyciemnienia

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
        const dist = i - mid;
        if (dist === 0) {
            colors.push(baseColor);
        } else if (dist < 0) {
            const t = Math.abs(dist) / (leftMax || 1);
            colors.push(lighten(baseColor, t * maxDelta));
        } else {
            const t = dist / (rightMax || 1);
            colors.push(darken(baseColor, t * maxDelta));
        }
    }
    return colors;
};

// ZMIANA: jeden kolor bazowy -> generujemy listę kolorów długości frameCount
export const generateWavePaths = (
    frameCount: number = 3,
    layerCount: number = 5,
    baseColor: string = '#b62d41'
): Array<Array<{ d: string; fill: string }>> => {
    const frameColors = generateColorScale(baseColor, frameCount);
    const frames: Array<Array<{ d: string; fill: string }>> = [];

    for (let frame = 0; frame < frameCount; frame++) {
        const layers: Array<{ d: string; fill: string }> = [];

        for (let layer = 0; layer < layerCount; layer++) {
            const path = generateWavePath(
                900,
                600,
                8 + layer * 2 + Math.random() * 5,
                0.008 + (layerCount - layer) * Math.random() * 0.004,
                Math.random() * Math.PI * 2,
                360 + layer * 40 + Math.random() * 20,
                0.2 + Math.random() * 0.1
            );

            // ten sam kolor dla wszystkich warstw w danej klatce
            layers.push({ d: path, fill: frameColors[layer] });
        }

        frames.push(layers);
    }

    return frames;
};

const generateWavePath = (
    width: number = 900,
    height: number = 600,
    amplitude: number = 20,
    frequency: number = 0.01,
    phase: number = 0,
    baseY: number = 400,
    amplitudeVariation: number = 0.3
): string => {
    const points = 50;
    const step = width / points;

    let path = `M0 ${baseY}`;

    for (let i = 0; i <= points; i++) {
        const x = i * step;
        const progress = i / points;
        const variation = Math.sin(progress * Math.PI * 3) * amplitudeVariation;
        const currentAmplitude = amplitude * (1 + variation);
        const y = baseY + Math.sin(x * frequency + phase) * currentAmplitude;
        path += ` L${x} ${y}`;
    }

    path += ` L${width} ${height} L0 ${height} Z`;
    return path;
};
