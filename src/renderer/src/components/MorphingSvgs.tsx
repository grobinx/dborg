import React from "react";

interface WavePath {
    d: string;
    fill: string;
}

interface MorphingSvgPathsProps {
    /**
     * Każdy element tablicy to jeden SVG (stan animacji).
     * Każdy SVG to tablica ścieżek.
     * Przykład:
     * [
     *   [ {d, fill}, {d, fill} ], // SVG 1: path0, path1
     *   [ {d, fill}, {d, fill} ], // SVG 2: path0, path1
     *   ...
     * ]
     */
    paths: WavePath[][];
    duration?: number; // w sekundach
    viewBox?: string;
}

function getRandomDuration() {
    return (Math.random() * 20 + 20).toFixed(2); // 20-40s
}

export const MorphingSvgPaths: React.FC<MorphingSvgPathsProps> = ({
    paths,
    duration,
    viewBox = "0 0 900 600",
}) => {
    // Walidacja: co najmniej 2 SVG i każda ma tyle samo ścieżek
    if (paths.length < 2) {
        return <div style={{ color: "red" }}>Muszą być co najmniej 2 SVG!</div>;
    }
    const pathCount = paths[0].length;
    if (!paths.every((svg) => svg.length === pathCount)) {
        return <div style={{ color: "red" }}>Każdy SVG musi mieć tyle samo ścieżek!</div>;
    }

    // Losuj duration dla każdej ścieżki jeśli nie podano globalnego
    const durations = React.useMemo(
        () =>
            duration !== undefined
                ? Array(pathCount).fill(duration)
                : Array.from({ length: pathCount }, getRandomDuration),
        [duration, pathCount]
    );

    return (
        <svg
            viewBox={viewBox}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "auto", display: "block" }}
        >
            {Array.from({ length: pathCount }).map((_, pathIdx) => {
                // Zbierz kolejne stany tej ścieżki z każdego SVG
                const pathStates = paths.map((svg) => svg[pathIdx]);
                const fill = pathStates[0].fill;
                const dValues = pathStates.map((s) => s.d).join(";") + ";" + pathStates[0].d;
                return (
                    <path key={pathIdx} fill={fill} d={pathStates[0].d}>
                        <animate
                            attributeName="d"
                            dur={`${durations[pathIdx]}s`}
                            repeatCount="indefinite"
                            values={dValues}
                        />
                        <animate
                            attributeName="fill"
                            dur={`${durations[pathIdx]}s`}
                            repeatCount="indefinite"
                            values={
                                pathStates.map((s) => s.fill).join(";") + ";" + pathStates[0].fill
                            }
                        />
                    </path>
                );
            })}
        </svg>
    );
};